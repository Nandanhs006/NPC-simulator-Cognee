FALLBACK_NODES = [
    {"id": "Lalo", "label": "Lalo", "type": "Player", "dataset": "kingdom_town_shared", "properties": {"description": "A charismatic visitor to Silver Creeks."}},
    {"id": "Nacho", "label": "Nacho", "type": "Player", "dataset": "kingdom_town_shared", "properties": {"description": "A quiet partner of Lalo, known for his sticky fingers."}},
    {"id": "Sheriff", "label": "Sheriff Jeremiah Ashcroft", "type": "NPC", "dataset": "kingdom_npc_sheriff", "properties": {"description": "The law in Silver Creeks. Prioritizes legal facts."}},
    {"id": "Banker", "label": "Banker Victor Sterling", "type": "NPC", "dataset": "kingdom_npc_banker", "properties": {"description": "Manager of the Silver Creeks Bank. Cares about wealth and credit."}},
    {"id": "Doctor", "label": "Doctor Isaac Vance", "type": "NPC", "dataset": "kingdom_npc_doctor", "properties": {"description": "The town doctor. Quiet and professional."}},
    {"id": "Store", "label": "General Store Ruth Hayes", "type": "NPC", "dataset": "kingdom_npc_general_store", "properties": {"description": "Owner of the Hayes General Store. Friendly and loves gossip."}},
    {"id": "Ranch", "label": "Ranch Owner Wade Granger", "type": "NPC", "dataset": "kingdom_npc_ranch", "properties": {"description": "Owner of Creekwoods Ranch. Emotional and protective of his cattle."}},
    {"id": "Bartender", "label": "Bartender Buck", "type": "NPC", "dataset": "kingdom_npc_bartender", "properties": {"description": "Owner of the IronOak Saloon. Spreads saloon gossip."}},
    {"id": "Bank_Location", "label": "Silver Creeks Bank", "type": "Location", "dataset": "kingdom_town_shared", "properties": {"description": "The local financial institution."}},
    {"id": "Ranch_Location", "label": "Creekwoods Ranch", "type": "Location", "dataset": "kingdom_town_shared", "properties": {"description": "Wade Granger's vast cattle ranch."}},
    {"id": "Store_Location", "label": "Hayes General Store", "type": "Location", "dataset": "kingdom_town_shared", "properties": {"description": "Supplies dry beans, ammunition, and fresh rope."}},
    {"id": "Saloon_Location", "label": "IronOak Saloon", "type": "Location", "dataset": "kingdom_town_shared", "properties": {"description": "Where town gossip and whiskey flow."}},
]

FALLBACK_EDGES = [
    {"source": "Lalo", "target": "Nacho", "type": "partner_of", "dataset": "kingdom_town_shared", "properties": {}},
    {"source": "Banker", "target": "Bank_Location", "type": "owns", "dataset": "kingdom_npc_banker", "properties": {}},
    {"source": "Ranch", "target": "Ranch_Location", "type": "owns", "dataset": "kingdom_npc_ranch", "properties": {}},
    {"source": "Store", "target": "Store_Location", "type": "owns", "dataset": "kingdom_npc_general_store", "properties": {}},
    {"source": "Bartender", "target": "Saloon_Location", "type": "owns", "dataset": "kingdom_npc_bartender", "properties": {}},
    
    {"source": "Banker", "target": "Sheriff", "type": "knows", "dataset": "kingdom_npc_banker", "properties": {}},
    {"source": "Doctor", "target": "Sheriff", "type": "knows", "dataset": "kingdom_npc_doctor", "properties": {}},
    {"source": "Banker", "target": "Doctor", "type": "knows", "dataset": "kingdom_npc_banker", "properties": {}},
    {"source": "Store", "target": "Ranch", "type": "trusts", "dataset": "kingdom_npc_general_store", "properties": {}},
    {"source": "Store", "target": "Sheriff", "type": "trusts", "dataset": "kingdom_npc_general_store", "properties": {}},
    {"source": "Ranch", "target": "Sheriff", "type": "trusts", "dataset": "kingdom_npc_ranch", "properties": {}},
    {"source": "Banker", "target": "Ranch", "type": "dislikes", "dataset": "kingdom_npc_banker", "properties": {}},
    {"source": "Ranch", "target": "Banker", "type": "dislikes", "dataset": "kingdom_npc_ranch", "properties": {}},

    # Buck is friends with everyone — connects him into the main graph cluster
    {"source": "Bartender", "target": "Sheriff", "type": "friends", "dataset": "kingdom_npc_bartender", "properties": {}},
    {"source": "Bartender", "target": "Store", "type": "friends", "dataset": "kingdom_npc_bartender", "properties": {}},
    {"source": "Bartender", "target": "Ranch", "type": "friends", "dataset": "kingdom_npc_bartender", "properties": {}},
    {"source": "Bartender", "target": "Doctor", "type": "knows", "dataset": "kingdom_npc_bartender", "properties": {}},
    {"source": "Bartender", "target": "Banker", "type": "knows", "dataset": "kingdom_npc_bartender", "properties": {}},
]

def is_meaningful_node(node_id: str) -> bool:
    node_id_lower = node_id.lower()
    meaningful_keywords = [
        "lalo", "nacho", "sheriff", "banker", "doctor", "store", "ranch", "bartender",
        "jeremiah", "victor", "isaac", "ruth", "wade", "buck", "ashcroft", "sterling",
        "vance", "hayes", "granger", "bank_location", "ranch_location", "store_location", "saloon_location"
    ]
    return any(kw in node_id_lower for kw in meaningful_keywords)

def classify_node_type(node_id: str, label: str) -> str:
    clean_id = node_id.lower()
    clean_label = label.lower() if label else ""
    if clean_id in ["lalo", "nacho"]:
        return "Player"
    if any(n in clean_id or n in clean_label for n in ["sheriff", "banker", "doctor", "general_store", "ranch", "bartender", "jeremiah", "victor", "isaac", "ruth", "wade", "buck"]):
        return "NPC"
    if any(l in clean_id or l in clean_label for l in ["ranch", "bank", "store", "saloon", "clinic", "location"]):
        return "Location"
    if any(c in clean_id or c in clean_label for c in ["attack", "steal", "theft", "assault", "robbery", "crime"]):
        return "Crime"
    if any(r in clean_id or r in clean_label for r in ["rumor", "gossip", "heard"]):
        return "Rumor"
    return "Memory"
