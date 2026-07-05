import config  # Load config first to set Cognee system environment variables
from fastapi import APIRouter, BackgroundTasks, HTTPException
from cognee.modules.users.methods import get_default_user

from models.npc import ChatRequest
from models.response import NPCResponse
from services.reputation import load_state, save_state, apply_reputation_cascade, run_consolidation_task
from services.memory_service import recall_context, seed_lore_if_needed, retrieve_connected_graph_memories
from services.ai_service import load_npc_personality, get_structured_npc_response
from services.propagation import save_memories_task, propagate_event_memory
from utils.memory_parser import format_recall_results
from utils.decay import parse_retrieved_memories

router = APIRouter()

@router.post("/api/v1/chat")
async def chat_endpoint(payload: ChatRequest, background_tasks: BackgroundTasks):
    user = await get_default_user()
    await seed_lore_if_needed(user)

    state = load_state()
    if payload.npc_id not in state["npcs"]:
        raise HTTPException(status_code=400, detail="Invalid NPC ID")

    npc_state = state["npcs"][payload.npc_id]
    day = state.get("day", 1)
    
    player_id = payload.player_id.lower()
    partner_id = "nacho" if player_id == "lalo" else "lalo"

    trust_key = f"trust_{player_id}"
    partner_key = f"trust_{partner_id}"

    current_trust = npc_state.get(trust_key, 0)
    partner_trust = npc_state.get(partner_key, 0)
    current_reputation = state["reputation"]

    # 1. Retrieve memories from Cognee (Semantic Graph/Vector)
    recalled_facts = []
    search_queries = [
        payload.message
    ]
    
    # Dynamically expand search queries based on terms in the message to ensure robust memory recall
    message_lower = payload.message.lower()
    if player_id in message_lower or payload.action.upper() in ["ATTACK", "STEAL"]:
        search_queries.append(player_id.capitalize())
    if partner_id in message_lower:
        search_queries.append(partner_id.capitalize())

    keywords_to_check = {
        "bank": ["bank", "robbery", "stole", "steal", "theft", "sterling", "victor"],
        "sheriff": ["sheriff", "jeremiah", "ashcroft", "investigation"],
        "wade": ["wade", "granger", "ranch", "creekwoods"],
        "doctor": ["doctor", "vance", "isaac", "medical", "treatment"],
        "buck": ["buck", "bartender", "saloon", "ironoak", "gossip", "rumor"],
        "ruth": ["ruth", "hayes", "store", "shoplift"]
    }
    
    added_queries = set()
    for name, aliases in keywords_to_check.items():
        if any(alias in message_lower for alias in aliases):
            if name == "bank":
                added_queries.add("Victor Sterling bank")
                added_queries.add("bank robbery")
            elif name == "wade":
                added_queries.add("Wade Granger")
            elif name == "sheriff":
                added_queries.add("Sheriff Jeremiah Ashcroft")
            elif name == "doctor":
                added_queries.add("Doctor Isaac Vance")
            elif name == "buck":
                added_queries.add("Bartender Buck")
            elif name == "ruth":
                added_queries.add("Ruth Hayes")

    for q in added_queries:
        if q not in search_queries:
            search_queries.append(q)
    
    # Query private dataset with targeted search queries
    for query in search_queries:
        try:
            results = await recall_context(query, dataset_name=f"kingdom_npc_{payload.npc_id}", user=user)
            formatted = format_recall_results(results)
            if formatted and formatted not in recalled_facts:
                recalled_facts.append(formatted)
        except Exception as e:
            print(f"Private recall error: {e}")

    # Query shared town gossip with the main message only to prevent token bloating/rate limits
    try:
        results = await recall_context(payload.message, dataset_name="kingdom_town_shared", user=user)
        formatted = format_recall_results(results)
        if formatted and formatted not in recalled_facts:
            recalled_facts.append(formatted)
    except Exception as e:
        print(f"Shared recall error: {e}")

    # 2. Parse & Sort Memories by Importance (Decay Filter)
    recalled_context_raw = "\n".join(recalled_facts) if recalled_facts else ""
    sorted_memories = parse_retrieved_memories(recalled_context_raw, current_day=day)
    
    # Limit budget to top 5 important memories to prevent token limits
    decayed_memories = sorted_memories[:5]
    recalled_context_text = "\n".join([f"({m['importance']}) {m['text']}" for m in decayed_memories]) if decayed_memories else "No prior memories found."

    # 3. Retrieve Graph-Traversed Social Connections & Timeline
    recent_timeline = "\n".join([f"- Day {t['day']}: {t['description']}" for t in state.get("timeline", [])[-3:]])
    connected_memories = await retrieve_connected_graph_memories(payload.npc_id, user)
    connected_memories_text = "\n".join([f"✓ {m}" for m in connected_memories]) if connected_memories else "No known social connections."
    
    opinion_key = f"opinion_{player_id}"
    current_opinion = npc_state.get(opinion_key, "Stranger")

    # Load NPC personality dynamically from file
    personality_prompt = load_npc_personality(payload.npc_id)

    # 4. Call LLM (Highly token-optimized with trust-dialogue rubric & Rumor Confidence rules)
    system_prompt = (
        f"{personality_prompt}\n"
        f"Timeline: Day {day}\n"
        f"Talking to: {payload.player_id.capitalize()} (Currently viewed as: '{current_opinion}')\n"
        f"--- ACTIVE TRUST STATS ---\n"
        f"* Trust in {payload.player_id.capitalize()}: {current_trust}\n"
        f"* Trust in Partner {partner_id.capitalize()}: {partner_trust}\n"
        f"* Town Reputation: {current_reputation}\n"
        f"--- COGNEE SOCIAL GRAPH RELATIONSHIPS ---\n"
        f"{connected_memories_text}\n"
        f"--- COGNEE RECALLED MEMORIES ---\n"
        f"{recalled_context_text}\n"
        f"--- RECENT TOWN EVENTS ---\n"
        f"{recent_timeline if recent_timeline else '- None yet'}\n"
        f"--- TRUST DIALOGUE RUBRIC ---\n"
        f"- Hostile (Trust < -40): Refuse service/deals, demand they leave, keep replies short, tell them to get out.\n"
        f"- Wary (-40 to -11): Short, guarded replies. Avoid sensitive topics. Reference partner's misdeeds (Partnership Awareness).\n"
        f"- Neutral (-10 to 49): Standard professional dialogue.\n"
        f"- High Trust (50 to 100): Enthusiastic, share secrets/rumors, offer 20% discounts, defend them, share extra information.\n"
        f"--- RUMOR RULES ---\n"
        f"Do not treat rumors as verified facts. Express uncertainty unless the memory has 100% confidence. Speak with 'I heard folks talking...' if confidence is low.\n"
        f"--- DIRECTIONS ---\n"
        f"Calculate trust_change (-30 to +30), reputation_change (-20 to +20). Return player_opinion if a new trait is formed.\n"
        f"- If the player shares a rumor, notable news, or crime, populate gossip_message with a concise third-person summary of the news (e.g. 'Wade Granger reportedly stole from the bank') so it can spread to the town."
    )

    formatted_input = f"Action: {payload.action}\nMessage: {payload.message}"

    try:
        npc_res = await get_structured_npc_response(formatted_input, system_prompt)

        # Update persistent opinions if generated
        if npc_res.player_opinion:
            state["npcs"][payload.npc_id][opinion_key] = npc_res.player_opinion

        # 5. Update trust scores dynamically using Cascading Reputation formulas
        apply_reputation_cascade(
            state,
            payload.npc_id,
            player_id,
            partner_id,
            payload.action,
            npc_res.trust_change,
            npc_res.reputation_change
        )
        
        # 6. Update Chronological Timeline history
        desc = f"{player_id.capitalize()} spoke to {npc_state['name']} (Action: {payload.action})."
        if payload.action.upper() == "ATTACK":
            desc = f"{player_id.capitalize()} attacked Wade Granger at Creekwoods Ranch."
        elif payload.action.upper() == "STEAL":
            desc = f"A theft occurred involving {player_id.capitalize()} at the bank."
        
        state["timeline"] = state.get("timeline", [])
        state["timeline"].append({"day": day, "description": desc})
        state["timeline"] = state["timeline"][-10:] # Keep last 10
        
        save_state(state)

        # 7. Formulate and save memories with proper metadata headers
        timestamp = f"Day {day}"
        interaction_summary = (
            f"[Metadata] Source: Witness | Category: {npc_res.category} | Visibility: {npc_res.visibility} | "
            f"Importance: {npc_res.importance} | Confidence: {npc_res.confidence} | Timestamp: {timestamp} "
            f"[Memory] {payload.player_id.capitalize()} said: \"{payload.message}\" (Action: {payload.action}). "
            f"{npc_state['name']} responded: '{npc_res.dialogue}'."
        )
        
        # Save memory and propagate gossip/rumors synchronously to avoid race conditions in simulation
        try:
            await save_memories_task(
                interaction_summary,
                npc_res.gossip_message,
                npc_res.player_opinion,
                payload.npc_id,
                payload.player_id,
                day,
                user
            )
        except Exception as e:
            print(f"Error saving memories synchronously: {e}")

        # Call custom propagation for crimes (witness vs rumor) synchronously so graph/memory reflects it
        if payload.action.upper() in ["ATTACK", "STEAL"]:
            try:
                await propagate_event_memory(
                    payload.action.upper(),
                    payload.npc_id,
                    player_id,
                    user
                )
            except Exception as e:
                print(f"Error propagating crime events synchronously: {e}")

        new_trust = state["npcs"][payload.npc_id][trust_key]
        new_reputation = state["reputation"]

        return {
            "dialogue": npc_res.dialogue,
            "attitude": npc_res.attitude,
            "trust": new_trust,
            "reputation": new_reputation,
            "memory_context": recalled_context_text,
            "gossip_propagated": bool(npc_res.gossip_message),
            "category": npc_res.category,
            "importance": npc_res.importance,
            "confidence": npc_res.confidence,
            "visibility": npc_res.visibility,
            "reasoning_chain": npc_res.reasoning_chain,
            "memories": decayed_memories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/v1/kingdom/improve")
async def improve_endpoint(background_tasks: BackgroundTasks):
    user = await get_default_user()
    background_tasks.add_task(run_consolidation_task, user)
    return {"status": "success", "message": "Memory consolidation started in the background."}
