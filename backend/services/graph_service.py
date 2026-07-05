"""
graph_service.py — Knowledge Graph Retrieval & Contraction Compiler

Retrieves the full knowledge graph from Cognee's graph engine across all
NPC datasets, then contracts generic intermediate event nodes into direct
storytelling edges between meaningful character/location entities.
"""

import config  # Load config first to set Cognee system environment variables
from cognee.modules.users.methods import get_default_user
from cognee.modules.data.methods import get_datasets_by_name
from cognee.context_global_variables import set_database_global_context_variables
from cognee.infrastructure.databases.graph import get_graph_engine
from models.graph import (
    FALLBACK_NODES, FALLBACK_EDGES,
    is_meaningful_node, classify_node_type,
)

ALL_DATASETS = [
    "kingdom_npc_sheriff", "kingdom_npc_banker", "kingdom_npc_doctor",
    "kingdom_npc_general_store", "kingdom_npc_ranch", "kingdom_npc_bartender",
    "kingdom_town_shared",
]


def get_canonical_id(name: str) -> str:
    """Map a raw node ID to its canonical fallback ID."""
    clean = name.replace("_", " ").lower().strip()
    for fallback_n in FALLBACK_NODES:
        fb_id = fallback_n["id"]
        fb_label = fallback_n["label"].lower()
        if fb_id.lower() == clean or clean in fb_label or fb_label in clean:
            return fb_id
    return name.replace("_", " ").title()


async def compile_graph_data() -> dict:
    """Retrieve all graph data from Cognee datasets, contract generic event
    nodes, and return a clean {nodes, edges} dictionary for D3 rendering."""
    user = await get_default_user()

    all_nodes = {n["id"]: dict(n) for n in FALLBACK_NODES}
    all_edges = [dict(e) for e in FALLBACK_EDGES]

    raw_nodes = {}
    raw_edges = []

    for ds_name in ALL_DATASETS:
        ds = await get_datasets_by_name(ds_name, user.id)
        if not ds:
            continue
        try:
            async with set_database_global_context_variables(ds[0].id, ds[0].owner_id):
                graph_engine = await get_graph_engine()
                nodes, edges = await graph_engine.get_graph_data()
                for node_id, attrs in nodes:
                    raw_nodes[node_id] = attrs
                for source, target, rel_type, attrs in edges:
                    raw_edges.append((source, target, rel_type, attrs, ds_name))
        except Exception:
            pass

    # Build adjacency list for non-meaningful intermediate nodes
    event_connections = {}

    for source, target, rel_type, attrs, ds_name in raw_edges:
        src_meaningful = is_meaningful_node(source)
        tgt_meaningful = is_meaningful_node(target)

        if src_meaningful and tgt_meaningful:
            src_id = get_canonical_id(source)
            tgt_id = get_canonical_id(target)
            if not any(e["source"] == src_id and e["target"] == tgt_id and e["type"] == rel_type for e in all_edges):
                all_edges.append({
                    "source": src_id, "target": tgt_id, "type": rel_type,
                    "dataset": ds_name, "properties": attrs,
                })
        elif src_meaningful and not tgt_meaningful:
            event_connections.setdefault(target, []).append((source, rel_type, "out", attrs))
        elif not src_meaningful and tgt_meaningful:
            event_connections.setdefault(source, []).append((target, rel_type, "in", attrs))

    # Contract generic event nodes
    for event_id, connections in event_connections.items():
        if len(connections) >= 2:
            node_attrs = raw_nodes.get(event_id, {})
            desc = (
                node_attrs.get("description") or node_attrs.get("text") or node_attrs.get("content") or ""
            ).lower()

            rel_label = None
            if "attack" in desc or "beat" in desc:
                rel_label = "attacked"
            elif "steal" in desc or "theft" in desc or "shoplift" in desc:
                rel_label = "stole from"
            elif "report" in desc:
                rel_label = "reported to"
            elif "treat" in desc or "medical" in desc:
                rel_label = "treated"
            elif "gossip" in desc or "rumor" in desc or "heard" in desc:
                rel_label = "rumored to" if "reported" in desc else "rumored by"
            elif "inform" in desc:
                rel_label = "informed"

            for i in range(len(connections)):
                for j in range(i + 1, len(connections)):
                    conn1, conn2 = connections[i], connections[j]
                    node1_id = get_canonical_id(conn1[0])
                    node2_id = get_canonical_id(conn2[0])
                    if node1_id == node2_id:
                        continue

                    if conn1[2] == "out" and conn2[2] == "in":
                        src, tgt = node1_id, node2_id
                    elif conn1[2] == "in" and conn2[2] == "out":
                        src, tgt = node2_id, node1_id
                    elif node1_id in ["Lalo", "Nacho"] and node2_id not in ["Lalo", "Nacho"]:
                        src, tgt = node1_id, node2_id
                    elif node2_id in ["Lalo", "Nacho"] and node1_id not in ["Lalo", "Nacho"]:
                        src, tgt = node2_id, node1_id
                    else:
                        src, tgt = node1_id, node2_id

                    final_rel = rel_label or conn1[1] or conn2[1] or "associated_with"
                    if not any(e["source"] == src and e["target"] == tgt and e["type"] == final_rel for e in all_edges):
                        all_edges.append({
                            "source": src, "target": tgt, "type": final_rel,
                            "dataset": "compiled_events",
                            "properties": {"compiled_from": event_id, "description": desc},
                        })
        else:
            for entity, rel_type, direction, attrs in connections:
                entity_id = get_canonical_id(entity)
                label = raw_nodes.get(event_id, {}).get("name") or raw_nodes.get(event_id, {}).get("node_id") or event_id
                node_type = classify_node_type(event_id, label)

                if label.lower() in ["conversation event", "relationship event", "default event"]:
                    continue

                all_nodes[event_id] = {
                    "id": event_id, "label": label, "type": node_type,
                    "dataset": "leaves", "properties": raw_nodes.get(event_id, {}),
                }
                if direction == "out":
                    src, tgt = entity_id, event_id
                else:
                    src, tgt = event_id, entity_id
                if not any(e["source"] == src and e["target"] == tgt and e["type"] == rel_type for e in all_edges):
                    all_edges.append({
                        "source": src, "target": tgt, "type": rel_type,
                        "dataset": "leaves", "properties": attrs,
                    })

    # Add meaningful raw nodes
    for node_id, attrs in raw_nodes.items():
        if is_meaningful_node(node_id):
            canonical = get_canonical_id(node_id)
            if canonical not in all_nodes:
                all_nodes[canonical] = {
                    "id": canonical,
                    "label": attrs.get("name") or attrs.get("node_id") or canonical,
                    "type": attrs.get("type") or classify_node_type(canonical, attrs.get("name", "")),
                    "dataset": "meaningful", "properties": attrs,
                }

    return {"nodes": list(all_nodes.values()), "edges": all_edges}
