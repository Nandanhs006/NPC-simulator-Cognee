from pydantic import BaseModel

class ChatRequest(BaseModel):
    player_id: str  # "lalo" or "nacho"
    npc_id: str
    message: str
    action: str = "TALK"
    session_id: str
