from services.memory_service import remember_event
from typing import Optional

async def save_memories_task(interaction_summary: str, gossip_message: Optional[str], player_opinion: Optional[str], npc_id: str, player_id: str, day: int, user):
    # 1. Save interaction memory
    try:
        await remember_event(interaction_summary, dataset_name=f"kingdom_npc_{npc_id}", user=user)
    except Exception as e:
        print(f"Background private memory save error: {e}")
        
    # 2. Save player opinion/trait if generated
    if player_opinion:
        opinion_summary = (
            f"[Metadata] Source: Witness | Category: Relationship | Importance: Medium | Confidence: 100 | Timestamp: Day {day} "
            f"[Memory] {npc_id.capitalize()} considers {player_id.capitalize()} to be '{player_opinion}'."
        )
        try:
            await remember_event(opinion_summary, dataset_name=f"kingdom_npc_{npc_id}", user=user)
        except Exception:
            pass

    # 3. Propagate gossip/rumors to town timeline and characters
    if gossip_message:
        gossip_summary = (
            f"[Metadata] Source: Rumor | Category: Rumor | Importance: High | Confidence: 30 | Timestamp: Day {day} "
            f"[Memory] Rumor: {gossip_message}"
        )
        try:
            await remember_event(gossip_summary, dataset_name="kingdom_town_shared", user=user)
        except Exception as e:
            print(f"Background shared memory save error: {e}")

        # Medical records remain private (do not propagate)
        if npc_id == "doctor":
            return

        # Buck the Bartender hears and spreads saloon gossip
        try:
            await remember_event(
                f"[Metadata] Source: Rumor | Category: Rumor | Importance: Medium | Confidence: 35 | Timestamp: Day {day} [Memory] Gossip: Buck heard that {gossip_message}",
                dataset_name="kingdom_npc_bartender",
                user=user
            )
        except Exception:
            pass

        # Buck tells Sheriff Jeremiah
        try:
            await remember_event(
                f"[Metadata] Source: Reported | Category: Crime report | Importance: High | Confidence: 70 | Timestamp: Day {day} [Memory] Bartender Buck reported to Sheriff that {gossip_message}",
                dataset_name="kingdom_npc_sheriff",
                user=user
            )
        except Exception:
            pass

        # Sheriff informs Banker Victor Sterling
        if npc_id != "banker":
            try:
                await remember_event(
                    f"[Metadata] Source: Reported | Category: Business | Importance: Medium | Confidence: 70 | Timestamp: Day {day} [Memory] Sheriff Jeremiah Ashcroft informed the bank that {gossip_message}",
                    dataset_name="kingdom_npc_banker",
                    user=user
                )
            except Exception:
                pass


async def propagate_event_memory(action: str, target_npc: str, player_id: str, user):
    if action == "ATTACK":
        # Ranch (Wade) Witness
        await remember_event(
            "[Metadata] Source: Witness | Category: Crime | Importance: Critical | Confidence: 100 [Memory] Nacho attacked me at Creekwoods Ranch.",
            dataset_name="kingdom_npc_ranch", user=user
        )
        # Sheriff Witness
        await remember_event(
            f"[Metadata] Source: Witness | Category: Crime | Importance: Critical | Confidence: 100 [Memory] Sheriff Ashcroft witnessed {player_id.capitalize()} attacking Wade Granger.",
            dataset_name="kingdom_npc_sheriff", user=user
        )
        # Doctor Reported
        await remember_event(
            f"[Metadata] Source: Reported | Category: Medical | Importance: High | Confidence: 70 [Memory] Doctor Vance treated Wade Granger for severe trauma after Sheriff Ashcroft reported {player_id.capitalize()} attacked Wade.",
            dataset_name="kingdom_npc_doctor", user=user
        )
        # Bartender Rumor
        await remember_event(
            f"[Metadata] Source: Rumor | Category: Rumor | Importance: Medium | Confidence: 40 [Memory] Buck heard from Doctor Vance that Wade Granger was treated for severe injuries after {player_id.capitalize()} attacked him.",
            dataset_name="kingdom_npc_bartender", user=user
        )
        # Ruth General Store Rumor
        await remember_event(
            f"[Metadata] Source: Rumor | Category: Rumor | Importance: Low | Confidence: 20 [Memory] Ruth Hayes heard saloon gossip that {player_id.capitalize()} beat Wade Granger half to death.",
            dataset_name="kingdom_npc_general_store", user=user
        )
        # Banker Rumor
        await remember_event(
            f"[Metadata] Source: Rumor | Category: Business | Importance: Low | Confidence: 30 [Memory] Banker Victor heard rumors that {player_id.capitalize()} committed an attack on Wade, posing a financial risk to the town.",
            dataset_name="kingdom_npc_banker", user=user
        )
        
    elif action == "STEAL":
        # General Store (Ruth) Witness
        await remember_event(
            f"[Metadata] Source: Witness | Category: Crime | Importance: High | Confidence: 100 [Memory] I caught {player_id.capitalize()} stealing inventory from my general store.",
            dataset_name="kingdom_npc_general_store", user=user
        )
        # Sheriff Reported
        await remember_event(
            f"[Metadata] Source: Reported | Category: Crime | Importance: High | Confidence: 75 [Memory] Ruth Hayes reported that {player_id.capitalize()} stole ammo from the store.",
            dataset_name="kingdom_npc_sheriff", user=user
        )
        # Bartender Rumor
        await remember_event(
            f"[Metadata] Source: Rumor | Category: Rumor | Importance: Medium | Confidence: 30 [Memory] Saloon rumor says {player_id.capitalize()} shoplifted items from the general store.",
            dataset_name="kingdom_npc_bartender", user=user
        )
