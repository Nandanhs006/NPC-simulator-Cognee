from pydantic import BaseModel
from typing import Dict, Any, List

class WorldState(BaseModel):
    reputation: int
    day: int
    timeline: List[Dict[str, Any]]
    npcs: Dict[str, Dict[str, Any]]

LOCATIONS = {
    "bank": "Silver Creeks Bank",
    "ranch": "Creekwoods Ranch",
    "store": "Hayes General Store",
    "saloon": "IronOak Saloon",
    "clinic": "Doctor Vance's Clinic"
}
