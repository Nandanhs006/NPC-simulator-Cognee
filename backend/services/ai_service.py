"""
ai_service.py — Structured LLM Gateway & Personality Prompt Loader

Handles all interactions with the language model, including loading
NPC personality prompts from disk and calling the structured output API.
"""

import os
import config  # Load config first to set Cognee system environment variables
from cognee.infrastructure.llm.LLMGateway import LLMGateway
from models.response import NPCResponse


def load_npc_personality(npc_id: str) -> str:
    """Load an NPC's personality prompt from the prompts/ directory.

    Falls back to a hardcoded default if the file is missing.
    """
    path = os.path.join("prompts", f"{npc_id}.txt")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    # Fallback to default descriptions if not found
    fallback = {
        "sheriff": "You are Sheriff Jeremiah Ashcroft, serious and authoritative. Prioritize evidence.",
        "banker": "You are Banker Victor Sterling. Care deeply about money and credit-worthiness.",
        "doctor": "You are Doctor Isaac Vance. Highly professional, protect patient privacy.",
        "general_store": "You are Ruth Hayes. Friendly general store owner, believes gossip.",
        "ranch": "You are Wade Granger. Proud ranch owner, emotional, slow to forgive.",
        "bartender": "You are Bartender Buck. Friendly bartender, spreads saloon gossip."
    }
    return fallback.get(npc_id, "")


async def get_structured_npc_response(formatted_input: str, system_prompt: str) -> NPCResponse:
    """Call the LLM with structured output constraints to get an NPCResponse."""
    return await LLMGateway.acreate_structured_output(
        text_input=formatted_input,
        system_prompt=system_prompt,
        response_model=NPCResponse,
    )
