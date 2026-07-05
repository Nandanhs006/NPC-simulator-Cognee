import { CogneeInstance } from "../instances/types";

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  dataset: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  dataset: string;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function getGraphData(instance: CogneeInstance): Promise<GraphData> {
  return instance
    .fetch("/v1/graph/data", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    .then(async (r) => {
      if (r.ok) return r.json();
      let errorMsg = `Failed to fetch graph data (${r.status})`;
      try {
        const body = await r.json();
        if (body.detail) errorMsg = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      } catch {}
      throw new Error(errorMsg);
    });
}
