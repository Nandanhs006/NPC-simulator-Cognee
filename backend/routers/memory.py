import config  # Load config first to set Cognee system environment variables
import os
import re
import asyncio
from fastapi import APIRouter, HTTPException
from cognee.modules.users.methods import get_default_user

from constants import ID_MAP
from services.reputation import load_state, save_state, DEFAULT_STATE
from services.memory_service import recall_context, seed_lore_if_needed, forget_event, retrieve_connected_graph_memories, wipe_cognee_system, retrieve_all_dataset_memories
from utils.decay import parse_retrieved_memories

router = APIRouter()

@router.get("/api/v1/state")
async def get_state_endpoint():
    return load_state()

@router.get("/api/v1/npc/{npc_id}/memory")
async def get_npc_memory_endpoint(npc_id: str, player_id: str):
    user = await get_default_user()
    state = load_state()
    
    if npc_id not in state["npcs"]:
        raise HTTPException(status_code=400, detail="Invalid NPC ID")
        
    npc_state = state["npcs"][npc_id]
    
    # 1. Fetch raw private memories and parse them to natural language
    recalled_facts = []
    try:
        recalled_facts = await retrieve_all_dataset_memories(f"kingdom_npc_{npc_id}", user)
    except Exception:
        pass
        
    personal_memories = []
    for fact in recalled_facts:
        match = re.search(r"\[Memory\]\s*(.*)$", fact)
        if match:
            clean_fact = match.group(1).strip()
            clean_fact = re.sub(r"^(Rumor:|Gossip:|Memory:)\s*", "", clean_fact, flags=re.IGNORECASE)
            if clean_fact not in personal_memories:
                personal_memories.append(clean_fact)
        else:
            if fact not in personal_memories:
                personal_memories.append(fact)
                
    # 2. Fetch shared town gossip
    gossip_facts = []
    try:
        gossip_facts = await retrieve_all_dataset_memories("kingdom_town_shared", user)
    except Exception:
        pass
        
    town_gossip = []
    for fact in gossip_facts:
        match = re.search(r"\[Memory\]\s*(.*)$", fact)
        if match:
            clean_fact = match.group(1).strip()
            clean_fact = re.sub(r"^(Rumor:|Gossip:|Memory:)\s*", "", clean_fact, flags=re.IGNORECASE)
            if clean_fact not in town_gossip:
                town_gossip.append(clean_fact)
        else:
            if fact not in town_gossip:
                town_gossip.append(fact)
                
    # 3. Retrieve connected relationships
    known_relationships = await retrieve_connected_graph_memories(npc_id, user)
    
    # 4. Get opinion, trust, and reputation
    opinion_key = f"opinion_{player_id.lower()}"
    current_opinion = npc_state.get(opinion_key, "Stranger")
    trust_score = npc_state.get(f"trust_{player_id.lower()}", 0)
    reputation = state.get("reputation", 0)
    
    return {
        "recent_memories": personal_memories[:5],
        "personal_memories": personal_memories,
        "town_gossip": town_gossip,
        "known_relationships": known_relationships,
        "current_opinion": current_opinion,
        "trust_score": trust_score,
        "reputation_impact": reputation
    }

@router.get("/api/v1/town/memories")
async def get_town_memories_endpoint():
    user = await get_default_user()
    state = load_state()
    current_day = state.get("day", 1)
    
    gossip_facts = []
    try:
        gossip_facts = await retrieve_all_dataset_memories("kingdom_town_shared", user)
    except Exception:
        pass
        
    raw_text = "\n".join(gossip_facts)
    parsed = parse_retrieved_memories(raw_text, current_day=current_day)
    
    # Filter out empty or placeholder memories
    parsed = [m for m in parsed if m["text"].strip() and "no context" not in m["text"].lower() and "context provided" not in m["text"].lower()]
    
    # Add timeline events from state.json as active memories so recent actions appear immediately
    for event in state.get("timeline", []):
        event_day = event.get("day", current_day)
        event_desc = event.get("description", "")
        # Deduplicate
        if not any(event_desc.lower() in m["text"].lower() for m in parsed):
            parsed.append({
                "text": event_desc,
                "importance": "High" if any(kw in event_desc.lower() for kw in ["attack", "steal", "robbery", "fight"]) else "Medium",
                "confidence": 100,
                "category": "Crime" if any(kw in event_desc.lower() for kw in ["attack", "steal", "robbery", "fight"]) else "Conversation",
                "visibility": "Shared",
                "source": "Reported" if "reported" in event_desc.lower() else "Witness",
                "timestamp": f"Day {event_day}"
            })
            
    # Add initial fallback events if timeline is empty
    if not parsed:
        parsed = [
            {
                "text": "Lalo and Nacho arrived in Silver Creeks. Sheriff Ashcroft keeps a watchful eye on them.",
                "importance": "Medium",
                "confidence": 100,
                "category": "Relationship",
                "visibility": "Shared",
                "source": "System",
                "timestamp": "Day 1"
            },
            {
                "text": "Victor Sterling checked vault reserves at the Silver Creeks Bank.",
                "importance": "Low",
                "confidence": 100,
                "category": "Business",
                "visibility": "Shared",
                "source": "System",
                "timestamp": "Day 1"
            },
            {
                "text": "Wade Granger reported a successful cattle sale at Creekwoods Ranch.",
                "importance": "Low",
                "confidence": 100,
                "category": "Business",
                "visibility": "Shared",
                "source": "System",
                "timestamp": "Day 1"
            }
        ]
        
    # Process metadata, days, and participants
    for m in parsed:
        text = m["text"]
        participants = []
        for name, full_name in ID_MAP.items():
            if name.lower() in text.lower() or full_name.lower() in text.lower():
                participants.append(full_name)
        for name in ["Lalo", "Nacho", "Sheriff", "Jeremiah", "Victor", "Sterling", "Isaac", "Vance", "Ruth", "Hayes", "Wade", "Granger", "Buck"]:
            if name.lower() in text.lower() and name not in participants:
                participants.append(name)
        m["participants"] = list(set(participants))
        
        day_match = re.search(r"Day\s*(\d+)", m["timestamp"], re.IGNORECASE)
        m["day"] = int(day_match.group(1)) if day_match else current_day
        
    return {
        "current_day": current_day,
        "memories": parsed
    }

@router.post("/api/v1/kingdom/forget")
async def forget_endpoint():
    # 1. Reset state.json
    save_state(DEFAULT_STATE)
    
    # 2. Reset Cognee Datasets/system completely
    try:
        await wipe_cognee_system()
        # Give the system a moment to clean up
        await asyncio.sleep(0.5)
    except Exception as e:
        print(f"Error wiping Cognee system: {e}")

    # 3. Re-initialize database schema immediately after wiping
    try:
        from cognee.modules.engine.operations.setup import setup
        await setup()
        # Give setup time to complete
        await asyncio.sleep(1.0)
    except Exception as e:
        print(f"Error running cognee setup during reset: {e}")
        raise

    # 4. Delete seeded trigger to force re-seeding
    if os.path.exists("seeded.txt"):
        os.remove("seeded.txt")

    # 5. Get user (now that database is properly initialized)
    try:
        user = await get_default_user()
    except Exception as e:
        print(f"Error getting default user after reset: {e}")
        raise

    # 6. Seed initial data
    await seed_lore_if_needed(user)

    return {"status": "success", "message": "Silver Creeks town reset successfully."}
