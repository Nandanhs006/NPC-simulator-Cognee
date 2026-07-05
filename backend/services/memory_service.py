"""
memory_service.py — Central Cognee Memory Lifecycle Integration

This module wraps Cognee's core memory APIs (remember, recall, improve, forget)
into explicit, domain-specific methods. It serves as the single point of
integration between the NPC Memory Simulator and the Cognee platform.

The Cognee Memory Lifecycle:
  1. remember_event()  → Persists a new fact/event into Cognee's knowledge graph
  2. recall_context()  → Retrieves relevant memories via semantic search
  3. improve_memory()  → Consolidates and strengthens memory connections
  4. forget_event()    → Removes memories from a dataset

Additional helpers:
  - seed_lore_if_needed() → Seeds initial world-building facts on first boot
  - wipe_cognee_system()  → Hard-resets the Cognee database (dev/debug only)
  - retrieve_connected_graph_memories() → Traverses the knowledge graph for
    social relationship edges connected to a specific NPC
"""

import os
import shutil
import config  # Load config first to set Cognee system environment variables
import cognee
from cognee.modules.data.methods import get_datasets_by_name, create_authorized_dataset
from cognee.context_global_variables import set_database_global_context_variables
from cognee.infrastructure.databases.graph import get_graph_engine
from constants import ID_MAP, NPCS


# ---------------------------------------------------------------------------
# Cognee Memory Lifecycle Methods
# ---------------------------------------------------------------------------

async def remember_event(fact: str, dataset_name: str, user) -> None:
    """Persist a new fact or event into Cognee's knowledge graph.

    This calls cognee.remember() which stores the fact as a node in the
    graph database and indexes it for semantic retrieval.
    """
    await cognee.remember(fact, dataset_name=dataset_name, user=user)


async def recall_context(query: str, dataset_name: str, user) -> list:
    """Retrieve memories relevant to the query via Cognee's semantic search.

    Returns a list of recall result objects from the Cognee vector/graph
    hybrid search engine.
    """
    from cognee import SearchType
    try:
        return await cognee.recall(query, datasets=[dataset_name], query_type=SearchType.SIMILARITY, user=user)
    except Exception as e:
        print(f"Error recalling with SearchType.SIMILARITY: {e}")
        return await cognee.recall(query, datasets=[dataset_name], user=user)


async def improve_memory(dataset_name: str, user) -> None:
    """Consolidate and strengthen memory connections in a dataset.

    This triggers Cognee's improve pipeline which re-indexes, deduplicates,
    and strengthens the knowledge graph connections.
    """
    await cognee.improve(dataset=dataset_name, user=user)


async def forget_event(dataset_name: str, user) -> None:
    """Remove all memories from a dataset.

    This calls cognee.forget() to clear the dataset's knowledge graph
    and vector store entries.
    """
    await cognee.forget(dataset=dataset_name, user=user)


# ---------------------------------------------------------------------------
# World Seeding
# ---------------------------------------------------------------------------

async def wipe_cognee_system():
    """Hard-reset the Cognee database directory (development/debug only)."""
    # 1. Try to use Cognee's prune module if available (safest, no Windows file lock issues)
    pruned_successfully = False
    try:
        if hasattr(cognee, "prune"):
            await cognee.prune.prune_data()
            await cognee.prune.prune_system(graph=True, vector=True, metadata=True, cache=True)
            pruned_successfully = True
    except Exception as e:
        print(f"Error using cognee prune: {e}")

    # 2. Fallback to physical deletion of localized directories ONLY if prune failed or was unavailable
    if not pruned_successfully:
        sys_dir = os.environ.get("SYSTEM_ROOT_DIRECTORY")
        data_dir = os.environ.get("DATA_ROOT_DIRECTORY")
        for db_dir in [sys_dir, data_dir]:
            if db_dir and os.path.exists(db_dir):
                try:
                    shutil.rmtree(db_dir)
                except Exception as e:
                    print(f"Error wiping database directory {db_dir}: {e}")

        # 3. Recreate clean empty directories so SQLite and LanceDB can initialize properly
        if sys_dir:
            os.makedirs(sys_dir, exist_ok=True)
        if data_dir:
            os.makedirs(data_dir, exist_ok=True)


async def seed_lore_if_needed(user):
    """Seed the initial world-building relationship facts on first boot.

    Creates per-NPC datasets and a shared town dataset, then populates them
    with Day 0 relationship memories that define the social graph baseline.
    Skips if a 'seeded.txt' marker file already exists.
    """
    if os.path.exists("seeded.txt"):
        return
    
    try:
        # Database is already initialized by startup_event in main.py
        # 1. Initialize datasets (0 LLM/token usage)
        npc_datasets = ["kingdom_npc_sheriff", "kingdom_npc_banker", "kingdom_npc_doctor", "kingdom_npc_general_store", "kingdom_npc_ranch", "kingdom_npc_bartender"]
        for ds in npc_datasets:
            await create_authorized_dataset(ds, user)
        await create_authorized_dataset("kingdom_town_shared", user)
        
        # 2. Seed initial relationship graph
        relationship_facts = [
            "[Metadata] Source: Witness | Category: Relationship | Importance: Critical | Confidence: 100 | Timestamp: Day 0 [Memory] Lalo and Nacho are partners. Lalo is charismatic and Nacho is a thief. Actions of one affect the reputation of both.",
            "[Metadata] Source: Witness | Category: Relationship | Importance: High | Confidence: 100 | Timestamp: Day 0 [Memory] Sheriff Jeremiah Ashcroft is trusted by everyone in Silver Creeks.",
            "[Metadata] Source: Witness | Category: Relationship | Importance: High | Confidence: 100 | Timestamp: Day 0 [Memory] Bartender Buck is friends with everyone in Silver Creeks.",
            "[Metadata] Source: Witness | Category: Relationship | Importance: High | Confidence: 100 | Timestamp: Day 0 [Memory] Victor Sterling is the banker. Victor is close to Jeremiah Ashcroft and Doctor Isaac Vance. Victor dislikes Wade Granger.",
            "[Metadata] Source: Witness | Category: Relationship | Importance: High | Confidence: 100 | Timestamp: Day 0 [Memory] Doctor Isaac Vance is friends with Victor Sterling and Sheriff Jeremiah Ashcroft.",
            "[Metadata] Source: Witness | Category: Relationship | Importance: High | Confidence: 100 | Timestamp: Day 0 [Memory] Ruth Hayes owns the Hayes General Store. Ruth trusts Buck, Sheriff Jeremiah, and Wade Granger.",
            "[Metadata] Source: Witness | Category: Relationship | Importance: High | Confidence: 100 | Timestamp: Day 0 [Memory] Wade Granger owns Creekwoods Ranch. Wade trusts Ruth Hayes and Sheriff Jeremiah. Wade dislikes Victor Sterling."
        ]
        
        for fact in relationship_facts:
            # Write to town shared graph
            await remember_event(fact, dataset_name="kingdom_town_shared", user=user)
            # Seed each NPC private brain with these rules
            for npc in ["sheriff", "banker", "doctor", "general_store", "ranch", "bartender"]:
                await remember_event(fact, dataset_name=f"kingdom_npc_{npc}", user=user)

        with open("seeded.txt", "w") as f:
            f.write("seeded")
    except Exception as e:
        print(f"Error seeding: {e}")


# ---------------------------------------------------------------------------
# Graph Traversal
# ---------------------------------------------------------------------------

async def retrieve_connected_graph_memories(npc_id: str, user) -> list:
    """Traverse Cognee's knowledge graph to find social relationship edges
    connected to a specific NPC.

    Returns a list of human-readable relationship descriptions.
    """
    relationships = []
    datasets = [f"kingdom_npc_{npc_id}", "kingdom_town_shared"]
    
    npc_name = ""
    for n in NPCS:
        if n["id"] == npc_id:
            npc_name = n["name"]
            break
            
    npc_terms = {npc_id.lower()}
    if npc_name:
        npc_terms.update(npc_name.lower().split())
        
    for ds_name in datasets:
        ds = await get_datasets_by_name(ds_name, user.id)
        if not ds:
            continue
        try:
            async with set_database_global_context_variables(ds[0].id, ds[0].owner_id):
                graph_engine = await get_graph_engine()
                _, edges = await graph_engine.get_graph_data()
                for source, target, rel_type, attrs in edges:
                    src_name = ID_MAP.get(source, source.replace("_", " "))
                    tgt_name = ID_MAP.get(target, target.replace("_", " "))
                    
                    # Filter out edges that do not involve the target NPC, Lalo, or Nacho
                    src_lower = src_name.lower()
                    tgt_lower = tgt_name.lower()
                    is_connected = (
                        any(term in src_lower for term in npc_terms) or 
                        any(term in tgt_lower for term in npc_terms) or
                        "lalo" in src_lower or "lalo" in tgt_lower or
                        "nacho" in src_lower or "nacho" in tgt_lower
                    )
                    if not is_connected:
                        continue
                        
                    rel_desc = attrs.get("description")
                    if not rel_desc:
                        rel_desc = f"{src_name} {rel_type.replace('_', ' ')} {tgt_name}."
                    
                    if rel_desc not in relationships:
                        relationships.append(rel_desc)
        except Exception:
            pass
            
    # Budget to top 5 connections to avoid token bloating
    return relationships[:5]


async def retrieve_all_dataset_memories(dataset_name: str, user) -> list:
    """Retrieve all raw text memories from a Cognee dataset by traversing the graph nodes."""
    memories = []
    ds = await get_datasets_by_name(dataset_name, user.id)
    if not ds:
        return memories
    try:
        async with set_database_global_context_variables(ds[0].id, ds[0].owner_id):
            graph_engine = await get_graph_engine()
            nodes, _ = await graph_engine.get_graph_data()
            for node_id, attrs in nodes:
                val = attrs.get("text") or attrs.get("content") or attrs.get("description")
                if val and isinstance(val, str) and val not in memories:
                    # Filter out simple entity names, only keep descriptive sentences
                    if len(val.split()) > 3:
                        memories.append(val)
    except Exception as e:
        print(f"Error retrieving all memories for {dataset_name}: {e}")
    return memories
