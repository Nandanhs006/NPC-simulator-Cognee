import os
import json
from config import STATE_DIR, STATE_FILE
from services.memory_service import improve_memory

DEFAULT_STATE = {
    "reputation": 0,
    "day": 1,
    "timeline": [],
    "npcs": {
        "sheriff": {"trust_lalo": 0, "trust_nacho": 0, "opinion_lalo": "Stranger", "opinion_nacho": "Stranger", "name": "Sheriff Jeremiah Ashcroft", "role": "Sheriff"},
        "banker": {"trust_lalo": 0, "trust_nacho": 0, "opinion_lalo": "Stranger", "opinion_nacho": "Stranger", "name": "Banker Victor Sterling", "role": "Banker"},
        "doctor": {"trust_lalo": 0, "trust_nacho": 0, "opinion_lalo": "Stranger", "opinion_nacho": "Stranger", "name": "Doctor Isaac Vance", "role": "Doctor"},
        "general_store": {"trust_lalo": 0, "trust_nacho": 0, "opinion_lalo": "Stranger", "opinion_nacho": "Stranger", "name": "General Store Ruth Hayes", "role": "General Store"},
        "ranch": {"trust_lalo": 0, "trust_nacho": 0, "opinion_lalo": "Stranger", "opinion_nacho": "Stranger", "name": "Ranch Owner Wade Granger", "role": "Ranch Owner"},
        "bartender": {"trust_lalo": 0, "trust_nacho": 0, "opinion_lalo": "Stranger", "opinion_nacho": "Stranger", "name": "Bartender Buck", "role": "Bartender"}
    }
}

def load_state() -> dict:
    os.makedirs(STATE_DIR, exist_ok=True)
    if not os.path.exists(STATE_FILE):
        save_state(DEFAULT_STATE)
        return DEFAULT_STATE
    try:
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    except Exception:
        save_state(DEFAULT_STATE)
        return DEFAULT_STATE

def save_state(state: dict):
    os.makedirs(STATE_DIR, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=4)

def apply_reputation_cascade(state: dict, npc_id: str, player_id: str, partner_id: str, action: str, trust_change: int, reputation_change: int):
    trust_key = f"trust_{player_id}"
    partner_key = f"trust_{partner_id}"

    # 1. Update target NPC trust for active player
    target_current = state["npcs"][npc_id].get(trust_key, 0)
    state["npcs"][npc_id][trust_key] = max(-100, min(100, target_current + trust_change))
    
    # 2. Update target NPC trust for partner (Accomplice/accomplishment effects)
    partner_current = state["npcs"][npc_id].get(partner_key, 0)
    partner_change = 0
    if trust_change < 0 and player_id == "nacho":
        # If Nacho commits crimes/lies, Lalo is affected by 50% of the drop
        partner_change = int(trust_change * 0.5)
    elif trust_change > 0 and player_id == "lalo":
        # If Lalo helps the town, Nacho is forgiven slightly (+25% of the gain)
        partner_change = int(trust_change * 0.25)
        
    if partner_change != 0:
        state["npcs"][npc_id][partner_key] = max(-100, min(100, partner_current + partner_change))

    # 3. Apply action-based cascading reputation to other NPCs
    action_upper = action.upper()
    if action_upper == "ATTACK":
        # Attacking Wade Granger or any citizen triggers instant fear
        for other_npc in state["npcs"]:
            if other_npc == npc_id:
                continue
            if other_npc == "sheriff":
                change = -30
            elif other_npc == "doctor":
                change = -10
            elif other_npc == "bartender":
                change = -15
            else:
                change = -5
            state["npcs"][other_npc][trust_key] = max(-100, min(100, state["npcs"][other_npc].get(trust_key, 0) + change))
            state["npcs"][other_npc][partner_key] = max(-100, min(100, state["npcs"][other_npc].get(partner_key, 0) + int(change * 0.5)))
            
    elif action_upper == "STEAL":
        for other_npc in state["npcs"]:
            if other_npc == npc_id:
                continue
            if other_npc == "sheriff":
                change = -15
            elif other_npc == "bartender":
                change = -10
            else:
                change = -2
            state["npcs"][other_npc][trust_key] = max(-100, min(100, state["npcs"][other_npc].get(trust_key, 0) + change))
            state["npcs"][other_npc][partner_key] = max(-100, min(100, state["npcs"][other_npc].get(partner_key, 0) + int(change * 0.5)))

    # 4. Update global town reputation
    state["reputation"] = max(-100, min(100, state["reputation"] + reputation_change))

async def run_consolidation_task(user):
    state = load_state()
    # Increment Day timeline on consolidation
    state["day"] = state.get("day", 1) + 1
    
    # Apply secondary reputation cascade after town consolidation
    # General Store -10, Banker -5 if reputation has dropped below 0
    if state["reputation"] < 0:
        for player in ["lalo", "nacho"]:
            tk = f"trust_{player}"
            state["npcs"]["general_store"][tk] = max(-100, min(100, state["npcs"]["general_store"].get(tk, 0) - 10))
            state["npcs"]["banker"][tk] = max(-100, min(100, state["npcs"]["banker"].get(tk, 0) - 5))

    save_state(state)

    datasets = ["kingdom_npc_sheriff", "kingdom_npc_banker", "kingdom_npc_doctor", "kingdom_npc_general_store", "kingdom_npc_ranch", "kingdom_npc_bartender", "kingdom_town_shared"]
    for ds_name in datasets:
        try:
            await improve_memory(dataset_name=ds_name, user=user)
        except Exception as e:
            print(f"Background consolidation error for {ds_name}: {e}")
