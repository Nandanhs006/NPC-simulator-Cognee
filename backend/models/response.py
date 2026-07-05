from pydantic import BaseModel, Field
from typing import Optional

class NPCResponse(BaseModel):
    dialogue: str = Field(description="The spoken dialogue response to the player.")
    attitude: str = Field(description="NPC's updated attitude toward the player: Hostile, Wary, Neutral, Friendly, or Allied.")
    trust_change: int = Field(description="Change in trust score for this NPC (range -30 to +30). Positive for helpful/gift/trade actions, negative for steal/attack/lies.")
    reputation_change: int = Field(description="Change in global town reputation (range -20 to +20). Affected by public actions.")
    gossip_message: Optional[str] = Field(default=None, description="If the action is notable or public, formulate a gossip rumor that other townspeople would repeat. Format as a third-person statement.")
    category: str = Field(description="Conversation category: Normal conversation, Rumor, Confession, Promise, Threat, Relationship discussion, Crime report, Business discussion, Medical discussion.")
    importance: str = Field(description="Importance score: Low, Medium, High, Critical.")
    confidence: int = Field(description="Confidence percentage (0 to 100) representing how certain this NPC is of their statement.")
    visibility: str = Field(default="Private", description="Visibility level: Private or Shared.")
    player_opinion: Optional[str] = Field(default=None, description="Long-term persistent trait opinion of the player formed during this conversation (e.g., 'Always pays', 'Often lies', 'Helpful', 'Violent', 'Generous').")
    reasoning_chain: str = Field(description="Brief step-by-step reasoning explaining how memories, relationships, and the partner's status influenced this response.")
