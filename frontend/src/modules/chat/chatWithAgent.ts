import { CogneeInstance } from "../instances/types";

export interface ChatRequest {
  playerId: string;
  npcId: string;
  message: string;
  action: string;
  sessionId: string;
}

export interface ChatResponse {
  dialogue: string;
  attitude: string;
  trust: number;
  reputation: number;
  memory_context: string | null;
  gossip_propagated: boolean;
  // Extended fields for inspector:
  category?: string;
  importance?: string;
  confidence?: number;
  visibility?: string;
  reasoning_chain?: string;
  memories?: Array<{
    text: string;
    importance: string;
    confidence: number;
    category: string;
    visibility: string;
    reasoning: string;
    source: string;
    target: string;
    timestamp: string;
  }>;
}

export default function chatWithAgent(
  instance: CogneeInstance,
  req: ChatRequest,
): Promise<ChatResponse> {
  const body = {
    player_id: req.playerId,
    npc_id: req.npcId,
    message: req.message,
    action: req.action,
    session_id: req.sessionId,
  };

  return instance
    .fetch("/v1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    .then(async (r) => {
      if (r.ok) return r.json();
      let errorMsg = `Chat failed (${r.status})`;
      try {
        const body = await r.json();
        if (body.error) errorMsg = body.error;
        if (body.hint) errorMsg += ` — ${body.hint}`;
        else if (body.detail) errorMsg = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      } catch { /* no JSON body */ }
      throw new Error(errorMsg);
    });
}
