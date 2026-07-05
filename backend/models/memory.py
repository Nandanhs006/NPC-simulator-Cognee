from pydantic import BaseModel
from typing import Optional

class MemoryItem(BaseModel):
    text: str
    importance: str
    imp_weight: int
    confidence: int
    category: str
    visibility: str
    source: str
    target: str
    timestamp: str
    day: Optional[int] = None
    participants: Optional[list] = None
