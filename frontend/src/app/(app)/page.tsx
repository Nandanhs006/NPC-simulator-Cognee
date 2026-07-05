"use client";

import { useState, useRef, useEffect } from "react";
import { useCogniInstance } from "@/modules/tenant/TenantProvider";
import chatWithAgent, { ChatResponse } from "@/modules/chat/chatWithAgent";
import getGraphData, { GraphData, GraphNode, GraphEdge } from "@/modules/graph/graphService";
import { Button, Card, Text, Divider, Badge, Loader, Progress, Tooltip, CloseButton } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import dynamic from "next/dynamic";
import { forceCollide } from "d3-force-3d";

// Dynamic import of ForceGraph2D to bypass Next.js SSR build errors
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GameMessage {
  id: string;
  role: "player" | "npc";
  action?: string;
  content: string;
  attitude?: string;
  memoryContextUsed?: string | null;
  timestamp: string;
  category?: string;
  importance?: string;
  confidence?: number;
  visibility?: string;
  reasoningChain?: string;
  memories?: any[];
}

interface NPCData {
  id: string;
  name: string;
  role: string;
  avatar: string;
  initialGreeting: string;
}

const NPCS: NPCData[] = [
  {
    id: "sheriff",
    name: "Sheriff Jeremiah Ashcroft",
    role: "Sheriff",
    avatar: "JA",
    initialGreeting: "Hold it right there. State your name and business in Silver Creeks. I'm keeping an eye on you.",
  },
  {
    id: "banker",
    name: "Banker Victor Sterling",
    role: "Banker",
    avatar: "VS",
    initialGreeting: "Welcome to the Silver Creeks Bank. Looking to secure a deposit, apply for a line of credit, or check your balance?",
  },
  {
    id: "doctor",
    name: "Doctor Isaac Vance",
    role: "Doctor",
    avatar: "IV",
    initialGreeting: "Step inside, friend. I see you've traveled a dusty road. What seems to be the ailment today?",
  },
  {
    id: "general_store",
    name: "General Store Ruth Hayes",
    role: "General Store",
    avatar: "RH",
    initialGreeting: "Welcome to Hayes General Store! We've got everything from dry beans to fresh rope. Let me know what you need.",
  },
  {
    id: "ranch",
    name: "Ranch Owner Wade Granger",
    role: "Ranch Owner",
    avatar: "WG",
    initialGreeting: "Howdy. If you're looking to purchase cattle, buy horses, or sign up for a hard day's ranch work, you've come to the right place.",
  },
  {
    id: "bartender",
    name: "Bartender Buck",
    role: "Bartender",
    avatar: "B",
    initialGreeting: "Welcome to the IronOak Saloon! Grab a stool, tell me what you're drinking, and if you've got any good stories from the trail.",
  },
];

const NPC_ACTIONS: Record<string, Array<{ key: string; label: string; description: string }>> = {
  sheriff: [
    { key: "TALK", label: "💬 Talk", description: "Engage in free-form conversation." },
    { key: "INVESTIGATE", label: "🔍 Investigate", description: "Inquire about crimes or suspicious behavior." },
    { key: "LIE", label: "🤥 Lie", description: "Present a deceitful statement." },
    { key: "ATTACK", label: "⚔️ Attack", description: "Threaten or strike the Sheriff." },
  ],
  banker: [
    { key: "TALK", label: "💬 Talk", description: "Engage in free-form conversation." },
    { key: "LOAN", label: "💵 Loan", description: "Request a financial loan from the bank." },
    { key: "STEAL", label: "🕵️ Steal", description: "Attempt to rob the bank's vault." },
    { key: "LIE", label: "🤥 Lie", description: "Present a deceitful statement." },
  ],
  doctor: [
    { key: "TALK", label: "💬 Talk", description: "Engage in free-form conversation." },
    { key: "ASSESS", label: "🩺 Assess", description: "Ask for a medical assessment or treatment." },
    { key: "STEAL", label: "🕵️ Steal", description: "Sneakily attempt to swipe medicine." },
    { key: "ATTACK", label: "⚔️ Attack", description: "Threaten or strike the Doctor." },
  ],
  general_store: [
    { key: "TALK", label: "💬 Talk", description: "Engage in free-form conversation." },
    { key: "BUY", label: "🛒 Buy", description: "Purchase supplies or items." },
    { key: "STEAL", label: "🕵️ Steal", description: "Attempt to shoplift items." },
    { key: "ATTACK", label: "⚔️ Attack", description: "Threaten or strike the store owner." },
  ],
  ranch: [
    { key: "TALK", label: "💬 Talk", description: "Engage in free-form conversation." },
    { key: "BUY", label: "🛒 Buy", description: "Purchase cattle or horses." },
    { key: "STEAL", label: "🕵️ Steal", description: "Attempt to rustle cattle or steal horses." },
    { key: "ATTACK", label: "⚔️ Attack", description: "Threaten or strike the rancher." },
  ],
  bartender: [
    { key: "TALK", label: "💬 Talk", description: "Engage in free-form conversation." },
    { key: "BUY", label: "🛒 Buy", description: "Buy a drink at the Saloon." },
    { key: "STEAL", label: "🕵️ Steal", description: "Attempt to steal gold or liquor." },
    { key: "ATTACK", label: "⚔️ Attack", description: "Threaten or start a saloon brawl." },
  ]
};

const ATTITUDE_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  Hostile: { bg: "#FEE2E2", color: "#B91C1C", border: "#EF4444", label: "Hostile" },
  Wary: { bg: "#FEF3C7", color: "#D97706", border: "#F59E0B", label: "Wary" },
  Neutral: { bg: "#F3F4F6", color: "#4B5563", border: "#9CA3AF", label: "Neutral" },
  Friendly: { bg: "#D1FAE5", color: "#059669", border: "#10B981", label: "Friendly" },
  Allied: { bg: "#ECFDF5", color: "#047857", border: "#F59E0B", label: "Allied" },
};

const INITIAL_HISTORIES = {
  lalo: {
    sheriff: [{ id: "s-init", role: "npc" as const, content: NPCS[0].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
    banker: [{ id: "ba-init", role: "npc" as const, content: NPCS[1].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
    doctor: [{ id: "d-init", role: "npc" as const, content: NPCS[2].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
    general_store: [{ id: "g-init", role: "npc" as const, content: NPCS[3].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
    ranch: [{ id: "r-init", role: "npc" as const, content: NPCS[4].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
    bartender: [{ id: "bar-init", role: "npc" as const, content: NPCS[5].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
  },
  nacho: {
    sheriff: [{ id: "s-init", role: "npc" as const, content: NPCS[0].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
    banker: [{ id: "ba-init", role: "npc" as const, content: NPCS[1].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
    doctor: [{ id: "d-init", role: "npc" as const, content: NPCS[2].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
    general_store: [{ id: "g-init", role: "npc" as const, content: NPCS[3].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
    ranch: [{ id: "r-init", role: "npc" as const, content: NPCS[4].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
    bartender: [{ id: "bar-init", role: "npc" as const, content: NPCS[5].initialGreeting, attitude: "Neutral", timestamp: new Date().toISOString() }],
  }
};

const NODE_COLORS: Record<string, string> = {
  Player: "#FBBF24",       // Gold
  NPC: "#3B82F6",          // Blue
  Location: "#10B981",     // Green
  Object: "#9CA3AF",       // Gray
  Rumor: "#8B5CF6",        // Purple
  Crime: "#EF4444",        // Red
  Relationship: "#06B6D4", // Cyan
  Conversation: "#34D399", // Emerald
  Memory: "#6366F1",       // Indigo
  TownEvent: "#EC4899",    // Pink
};

const classifyNode = (id: string, label: string, type: string) => {
  const cleanId = id.toLowerCase();
  const cleanLabel = label.toLowerCase();
  
  if (cleanId === "lalo" || cleanId === "nacho") return "Player";
  if (["sheriff", "banker", "doctor", "general_store", "ranch", "bartender", "jeremiah", "ashcroft", "victor", "sterling", "isaac", "vance", "ruth", "hayes", "wade", "granger", "buck"].some(n => cleanId.includes(n) || cleanLabel.includes(n))) {
    return "NPC";
  }
  if (["ranch", "bank", "store", "saloon", "clinic", "hospital", "town", "creekwoods", "hayes"].some(l => cleanId.includes(l) || cleanLabel.includes(l))) {
    return "Location";
  }
  if (["attack", "steal", "theft", "assault", "robbery", "shoplift", "crime", "fight"].some(c => cleanId.includes(c) || cleanLabel.includes(c))) {
    return "Crime";
  }
  if (["rumor", "gossip", "heard", "hearsay", "gossip:"].some(r => cleanId.includes(r) || cleanLabel.includes(r))) {
    return "Rumor";
  }
  if (["money", "ammo", "liquor", "gold", "cattle", "horse", "deposit", "credit", "medicine", "dry beans", "fresh rope"].some(o => cleanId.includes(o) || cleanLabel.includes(o))) {
    return "Object";
  }
  if (["relationship", "partner", "friend", "ally", "dislike"].some(r => cleanId.includes(r) || cleanLabel.includes(r))) {
    return "Relationship";
  }
  if (["conversation", "talk", "chat", "spoke"].some(c => cleanId.includes(c) || cleanLabel.includes(c))) {
    return "Conversation";
  }
  if (["event", "incident", "timeline", "day"].some(e => cleanId.includes(e) || cleanLabel.includes(e))) {
    return "TownEvent";
  }
  return "Memory";
};

const cleanRelationLabel = (type: string) => {
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

const cleanTextLabel = (label: string) => {
  return label.replace(/_/g, " ");
};

export default function RootNpcChatPage() {
  const { cogniInstance } = useCogniInstance();

  const [activePlayer, setActivePlayer] = useState<"lalo" | "nacho">("lalo");
  const [sessionIds] = useState(() => ({
    lalo: `frontier_session_lalo_${Date.now()}`,
    nacho: `frontier_session_nacho_${Date.now()}`,
  }));

  const [activeNpcId, setActiveNpcId] = useState("sheriff");
  const [histories, setHistories] = useState<Record<string, Record<string, GameMessage[]>>>(INITIAL_HISTORIES);
  const [selectedAction, setSelectedAction] = useState("TALK");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Global state
  const [reputation, setReputation] = useState(0);
  const [day, setDay] = useState(1);
  const [npcState, setNpcState] = useState<Record<string, any>>({
    sheriff: { trust_lalo: 0, trust_nacho: 0 },
    banker: { trust_lalo: 0, trust_nacho: 0 },
    doctor: { trust_lalo: 0, trust_nacho: 0 },
    general_store: { trust_lalo: 0, trust_nacho: 0 },
    ranch: { trust_lalo: 0, trust_nacho: 0 },
    bartender: { trust_lalo: 0, trust_nacho: 0 },
  });

  const [activeMessageId, setActiveMessageId] = useState<string | null>("s-init");
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Right panel active tab
  const [activeTab, setActiveTab] = useState<"brain" | "graph" | "timeline">("brain");

  // NPC Memory state
  const [npcMemory, setNpcMemory] = useState<{
    recent_memories: string[];
    personal_memories: string[];
    town_gossip: string[];
    known_relationships: string[];
    current_opinion: string;
    trust_score: number;
    reputation_impact: number;
  } | null>(null);
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);

  // Graph state
  const [rawNodes, setRawNodes] = useState<GraphNode[]>([]);
  const [rawEdges, setRawEdges] = useState<GraphEdge[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [relationFilter, setRelationFilter] = useState("");
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);

  // Town Memory state
  const [townMemories, setTownMemories] = useState<any[]>([]);
  const [isTownMemoriesLoading, setIsTownMemoriesLoading] = useState(false);

  // References and size measurer
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { ref: graphContainerRef, width: graphWidth, height: graphHeight } = useElementSize();
  const graphRef = useRef<any>(null);

  // Configure D3 forces to prevent node clogging and overlaps
  useEffect(() => {
    if (graphRef.current) {
      // Repel nodes strongly
      graphRef.current.d3Force("charge").strength(-550);
      // Keep links longer
      graphRef.current.d3Force("link").distance(135);
      // Collide force to push text boxes apart based on their label size
      graphRef.current.d3Force("collide", forceCollide((node: any) => {
        const label = node.label || node.id;
        const textWidth = label.length * 6.5; // Approx font width
        return Math.max(textWidth / 2 + 15, 55); // Collision radius
      }));
    }
  }, [graphData]);

  // Fetch NPC Memory state
  const fetchNpcMemory = async (npcId: string, playerId: string) => {
    if (!cogniInstance) return;
    setIsMemoryLoading(true);
    try {
      const res = await cogniInstance.fetch(`/v1/npc/${npcId}/memory?player_id=${playerId}`);
      if (res.ok) {
        const data = await res.json();
        setNpcMemory(data);
      }
    } catch (err) {
      console.error("Failed to fetch NPC memory:", err);
    } finally {
      setIsMemoryLoading(false);
    }
  };

  // Fetch Graph Data
  const fetchGraph = async () => {
    if (!cogniInstance) return;
    setIsGraphLoading(true);
    try {
      const data: GraphData = await getGraphData(cogniInstance);
      setRawNodes(data.nodes);
      setRawEdges(data.edges);

      // Process and classify nodes
      const processedNodes = data.nodes.map(n => ({
        id: n.id,
        label: cleanTextLabel(n.label),
        type: classifyNode(n.id, n.label, n.type),
        properties: n.properties || {}
      }));

      // Process edges
      const processedLinks = data.edges.map(e => ({
        source: e.source,
        target: e.target,
        type: cleanRelationLabel(e.type),
        properties: e.properties || {}
      }));

      // Merge physics simulation nodes to avoid graph flashing
      setGraphData(prev => {
        const nodeMap = new Map(prev.nodes.map(n => [n.id, n]));
        
        const mergedNodes = processedNodes.map(n => {
          const old = nodeMap.get(n.id);
          if (old) {
            return {
              ...old,
              ...n,
              // Maintain positions and velocity
              x: old.x,
              y: old.y,
              vx: old.vx,
              vy: old.vy
            };
          }
          return n;
        });

        const linkMap = new Map(prev.links.map(l => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return [`${s}-${t}-${l.type}`, l];
        }));

        const mergedLinks = processedLinks.map(l => {
          const key = `${l.source}-${l.target}-${l.type}`;
          const old = linkMap.get(key);
          if (old) {
            return { ...old, ...l };
          }
          return {
            source: l.source,
            target: l.target,
            type: l.type,
            properties: l.properties
          };
        });

        return { nodes: mergedNodes, links: mergedLinks };
      });
    } catch (err) {
      console.error("Failed to fetch graph data:", err);
    } finally {
      setIsGraphLoading(false);
    }
  };

  // Fetch Town Memories Timeline
  const fetchTownMemories = async () => {
    if (!cogniInstance) return;
    setIsTownMemoriesLoading(true);
    try {
      const res = await cogniInstance.fetch("/v1/town/memories");
      if (res.ok) {
        const data = await res.json();
        setTownMemories(data.memories || []);
      }
    } catch (err) {
      console.error("Failed to fetch town memories:", err);
    } finally {
      setIsTownMemoriesLoading(false);
    }
  };

  // Fetch current state
  const fetchState = async () => {
    if (!cogniInstance) return;
    try {
      const res = await cogniInstance.fetch("/v1/state");
      if (res.ok) {
        const data = await res.json();
        setReputation(data.reputation);
        setDay(data.day || 1);
        setNpcState(data.npcs);
      }
    } catch {}
  };

  useEffect(() => {
    fetchState();
    fetchNpcMemory(activeNpcId, activePlayer);
    fetchGraph();
    fetchTownMemories();
  }, [cogniInstance, activeNpcId, activePlayer]);

  // Set default action for NPC
  useEffect(() => {
    const actions = NPC_ACTIONS[activeNpcId] || [];
    if (actions.length > 0) {
      setSelectedAction(actions[0].key);
    }
  }, [activeNpcId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [histories, activeNpcId, activePlayer]);

  const activeMessages = histories[activePlayer]?.[activeNpcId] || [];
  const activeMessage = activeMessages.find((m) => m.id === activeMessageId) || null;
  const currentNpc = NPCS.find((n) => n.id === activeNpcId)!;

  const handleSend = async () => {
    if (!input.trim() && selectedAction === "TALK") return;
    if (!cogniInstance || isLoading) return;

    const playerMsgText = input.trim() || `[Player performs ${selectedAction}]`;
    setInput("");
    setIsLoading(true);
    setStatusMessage(null);

    const userMsg: GameMessage = {
      id: `player-${Date.now()}`,
      role: "player",
      action: selectedAction,
      content: playerMsgText,
      timestamp: new Date().toISOString(),
    };

    // Add user message
    setHistories((prev) => ({
      ...prev,
      [activePlayer]: {
        ...prev[activePlayer],
        [activeNpcId]: [...(prev[activePlayer]?.[activeNpcId] || []), userMsg]
      }
    }));

    const loadingMsgId = `npc-loading-${Date.now()}`;
    const loadingMsg: GameMessage = {
      id: loadingMsgId,
      role: "npc",
      content: `${currentNpc.name} is thinking...`,
      timestamp: new Date().toISOString(),
    };

    // Add loading message
    setHistories((prev) => ({
      ...prev,
      [activePlayer]: {
        ...prev[activePlayer],
        [activeNpcId]: [...(prev[activePlayer]?.[activeNpcId] || []), loadingMsg]
      }
    }));

    try {
      const chatRes: ChatResponse = await chatWithAgent(cogniInstance, {
        playerId: activePlayer,
        npcId: activeNpcId,
        message: playerMsgText,
        action: selectedAction,
        sessionId: sessionIds[activePlayer],
      });

      // Update message history
      setHistories((prev) => ({
        ...prev,
        [activePlayer]: {
          ...prev[activePlayer],
          [activeNpcId]: (prev[activePlayer]?.[activeNpcId] || []).map((msg) =>
            msg.id === loadingMsgId
              ? {
                  ...msg,
                  content: chatRes.dialogue,
                  attitude: chatRes.attitude,
                  memoryContextUsed: chatRes.memory_context,
                  category: chatRes.category,
                  importance: chatRes.importance,
                  confidence: chatRes.confidence,
                  visibility: chatRes.visibility,
                  reasoningChain: chatRes.reasoning_chain,
                  memories: chatRes.memories,
                }
              : msg
          )
        }
      }));

      // Update trust and reputation
      const trustKey = `trust_${activePlayer}`;
      setNpcState((prev) => ({
        ...prev,
        [activeNpcId]: { ...prev[activeNpcId], [trustKey]: chatRes.trust },
      }));
      setReputation(chatRes.reputation);
      
      // Update data components
      fetchNpcMemory(activeNpcId, activePlayer);
      fetchGraph();
      fetchTownMemories();
      
      setActiveMessageId(loadingMsgId);
    } catch (err: any) {
      setHistories((prev) => ({
        ...prev,
        [activePlayer]: {
          ...prev[activePlayer],
          [activeNpcId]: (prev[activePlayer]?.[activeNpcId] || []).map((msg) =>
            msg.id === loadingMsgId
              ? {
                  ...msg,
                  content: `*Coughs in soot* (Error: ${err.message || "Failed to communicate with NPC"})`,
                  attitude: "Neutral",
                }
              : msg
          )
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConsolidate = async () => {
    if (!cogniInstance || isConsolidating) return;
    setIsConsolidating(true);
    setStatusMessage({ text: "Consolidating town gossip into permanent memory graphs...", type: "info" });
    try {
      const res = await cogniInstance.fetch("/v1/kingdom/improve", { method: "POST" });
      if (res.ok) {
        setStatusMessage({ text: "Town memory consolidation complete! Gossip has spread.", type: "success" });
        setTimeout(() => {
          fetchGraph();
          fetchTownMemories();
          fetchState();
        }, 1500);
      } else {
        throw new Error();
      }
    } catch {
      setStatusMessage({ text: "Failed to consolidate memories.", type: "error" });
    } finally {
      setIsConsolidating(false);
    }
  };

  const handleReset = async () => {
    if (!cogniInstance || isWiping) return;
    if (!confirm("Are you sure you want to trigger Town Amnesia? This resets player trust, but keeps major partnerships and relationships!")) return;
    setIsWiping(true);
    setStatusMessage({ text: "Wiping minor memories and resetting state...", type: "info" });
    try {
      const res = await cogniInstance.fetch("/v1/kingdom/forget", { method: "POST" });
      if (res.ok) {
        setHistories(INITIAL_HISTORIES);
        setReputation(0);
        setDay(1);
        setNpcState({
          sheriff: { trust_lalo: 0, trust_nacho: 0 },
          banker: { trust_lalo: 0, trust_nacho: 0 },
          doctor: { trust_lalo: 0, trust_nacho: 0 },
          general_store: { trust_lalo: 0, trust_nacho: 0 },
          ranch: { trust_lalo: 0, trust_nacho: 0 },
          bartender: { trust_lalo: 0, trust_nacho: 0 },
        });
        setActiveMessageId("s-init");
        setSelectedNode(null);
        setStatusMessage({ text: "Town Amnesia triggered successfully! Cognee base structure preserved.", type: "success" });
        setTimeout(() => {
          fetchGraph();
          fetchTownMemories();
        }, 1000);
      } else {
        throw new Error();
      }
    } catch {
      setStatusMessage({ text: "Failed to trigger Town Amnesia.", type: "error" });
    } finally {
      setIsWiping(false);
    }
  };

  const getMeterColor = (val: number) => {
    if (val < -30) return "red";
    if (val < 10) return "gray";
    if (val < 60) return "teal";
    return "gold";
  };

  const activeTrust = npcState[activeNpcId]?.[`trust_${activePlayer}`] || 0;
  const currentActions = NPC_ACTIONS[activeNpcId] || [];

  // Filtered Graph Nodes & Links
  const filteredNodes = graphData.nodes.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase()) || node.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || node.type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredLinks = graphData.links.filter(link => {
    const sId = typeof link.source === "object" ? link.source.id : link.source;
    const tId = typeof link.target === "object" ? link.target.id : link.target;
    const matchesRelation = !relationFilter || link.type === relationFilter;
    return matchesRelation && filteredNodes.some(n => n.id === sId) && filteredNodes.some(n => n.id === tId);
  });

  const displayGraphData = { nodes: filteredNodes, links: filteredLinks };

  // Calculate Node details inside the Inspector overlay
  const getNodeInspectorDetails = (node: any) => {
    if (!node) return null;
    const nodeId = node.id;
    
    // Connected edges & NPCs
    const connectedEdges = rawEdges.filter(e => e.source === nodeId || e.target === nodeId);
    const connectedNpcs = Array.from(new Set(connectedEdges.map(e => {
      const neighbor = e.source === nodeId ? e.target : e.source;
      return cleanTextLabel(neighbor);
    })));

    // Categorize connected items for inspection
    const knownRumors = connectedEdges
      .filter(e => e.type.toLowerCase().includes("rumor") || e.type.toLowerCase().includes("gossip"))
      .map(e => `${cleanTextLabel(e.source)} rumored ${cleanTextLabel(e.target)}`);

    const knownCrimes = connectedEdges
      .filter(e => ["attacked", "stole_from", "assaulted", "crime"].some(kw => e.type.toLowerCase().includes(kw)))
      .map(e => `${cleanTextLabel(e.source)} ${cleanRelationLabel(e.type)} ${cleanTextLabel(e.target)}`);

    const allConnected = connectedEdges.map(e => ({
      source: cleanTextLabel(e.source),
      target: cleanTextLabel(e.target),
      type: cleanRelationLabel(e.type),
      desc: e.properties?.description || ""
    }));

    return {
      name: node.label,
      type: node.type,
      description: node.properties?.description || node.properties?.text || "No description in memory.",
      connectedNpcs,
      knownRumors,
      knownCrimes,
      allConnected,
      importance: node.properties?.importance || "Medium",
      lastUpdated: node.properties?.timestamp || "Day " + day
    };
  };

  const inspectorData = getNodeInspectorDetails(selectedNode);

  // Group Town Memories by day relative to the current day
  const groupTimelineMemories = (memories: any[]) => {
    const groups: Record<string, any[]> = {};
    const sorted = [...memories].sort((a, b) => b.day - a.day); // Latest first
    
    sorted.forEach(m => {
      let groupLabel = `Day ${m.day}`;
      if (m.day === day) groupLabel = "Today";
      else if (m.day === day - 1) groupLabel = "Yesterday";
      
      if (!groups[groupLabel]) groups[groupLabel] = [];
      groups[groupLabel].push(m);
    });
    return groups;
  };

  const timelineGroups = groupTimelineMemories(townMemories);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0F19] text-gray-200 overflow-hidden font-serif select-none">
      
      {/* 1. TOP HEADER */}
      <div className="h-14 border-b border-amber-900/30 bg-[#0F172A] px-6 flex justify-between items-center z-10 shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <Text className="font-serif text-lg font-bold text-amber-500 tracking-wider">
            🌵 SILVER CREEKS
          </Text>
          <span className="text-gray-700">|</span>
          <Text className="text-[10px] text-amber-600/80 font-mono tracking-widest uppercase">
            Cognitive Frontier Inspector
          </Text>
        </div>
        <div className="flex items-center gap-6">
          {/* Global Town Reputation Gauge */}
          <div className="flex items-center gap-3 bg-[#0B0F19] px-4 py-1.5 rounded-lg border border-amber-900/20">
            <Text size="10px" className="text-gray-400 font-bold uppercase tracking-wider font-mono">Town Reputation:</Text>
            <Text size="sm" className="font-serif font-bold text-amber-400">{reputation} / 100</Text>
            <div className="w-24">
              <Progress color={getMeterColor(reputation)} value={(reputation + 100) / 2} size="xs" />
            </div>
          </div>
          {/* Game Day */}
          <div className="bg-[#1E293B] px-3 py-1.5 rounded-lg border border-gray-800 flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 font-mono">Day:</span>
            <Badge color="amber" variant="filled" className="font-serif font-bold px-2 py-0.5">{day}</Badge>
          </div>
        </div>
      </div>

      {/* 2. MAIN GRID CONTAINER */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: PLAYER SWITCHER & NPC LIST */}
        <div className="w-76 border-r border-gray-800 bg-[#0F172A] p-4 flex flex-col gap-4 flex-shrink-0">
          <div>
            <Text className="font-serif text-lg font-bold text-amber-500 tracking-wide">
              Silver Creeks
            </Text>
            <Text className="text-[9px] text-gray-400 font-mono uppercase tracking-wider">Frontier Residents</Text>
          </div>

          {/* Player Switcher */}
          <div className="bg-[#1E293B] p-2 rounded-lg border border-gray-800 flex gap-2">
            <Button
              size="xs"
              onClick={() => {
                setActivePlayer("lalo");
                setActiveMessageId(histories["lalo"]?.[activeNpcId]?.[histories["lalo"]?.[activeNpcId]?.length - 1]?.id || null);
              }}
              variant={activePlayer === "lalo" ? "filled" : "outline"}
              color="amber"
              className="flex-1 font-bold font-serif"
            >
              Lalo (Charismatic)
            </Button>
            <Button
              size="xs"
              onClick={() => {
                setActivePlayer("nacho");
                setActiveMessageId(histories["nacho"]?.[activeNpcId]?.[histories["nacho"]?.[activeNpcId]?.length - 1]?.id || null);
              }}
              variant={activePlayer === "nacho" ? "filled" : "outline"}
              color="amber"
              className="flex-1 font-bold font-serif"
            >
              Nacho (Thief)
            </Button>
          </div>

          <Divider color="gray" />

          {/* Resident Selector list */}
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
            {NPCS.map((npc) => {
              const active = activeNpcId === npc.id;
              const trust = npcState[npc.id]?.[`trust_${activePlayer}`] || 0;
              const lastMsg = histories[activePlayer]?.[npc.id]?.[histories[activePlayer]?.[npc.id]?.length - 1];
              const attitude = lastMsg?.attitude || "Neutral";

              return (
                <div
                  key={npc.id}
                  onClick={() => {
                    setActiveNpcId(npc.id);
                    setActiveMessageId(histories[activePlayer]?.[npc.id]?.[histories[activePlayer]?.[npc.id]?.length - 1]?.id || null);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    active
                      ? "bg-[#1E293B] border-amber-500/50 shadow-lg shadow-amber-500/5"
                      : "bg-[#0F172A] border-gray-800 hover:bg-[#1E293B]/40 hover:border-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1E293B] border border-gray-800 flex items-center justify-center text-xs font-bold text-amber-500 flex-shrink-0 font-serif">
                        {npc.avatar}
                      </div>
                      <div>
                        <Text size="sm" className="font-serif font-bold text-white">{npc.name.split(" ").slice(-1)[0]}</Text>
                        <Text size="10px" color="gray" className="font-mono">{npc.role}</Text>
                      </div>
                    </div>
                    <Badge size="xs" color={ATTITUDE_STYLES[attitude]?.color || "gray"}>{attitude}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 font-mono">
                    <span>Trust</span>
                    <span className="font-semibold">{trust} / 100</span>
                  </div>
                  <Progress color={getMeterColor(trust)} value={(trust + 100) / 2} size="xs" />
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER PANEL: UNCHANGED CHAT SECTION */}
        <div className="flex-1 flex flex-col h-full bg-[#0B0F19]">
          
          {/* Dialogue Header Banner */}
          <div className="px-6 py-3.5 border-b border-gray-800 bg-[#0F172A]/50 flex justify-between items-center z-10 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">Confronting:</span>
              <Text className="font-serif text-sm font-bold text-amber-500">{currentNpc.name}</Text>
              <Badge size="xs" color="gray" variant="outline">{currentNpc.role}</Badge>
            </div>
            <div className="flex items-center gap-2 bg-[#1E293B] px-3 py-1 rounded-full border border-gray-800">
              <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 font-mono">Active Player:</span>
              <Badge size="xs" color="amber" variant="filled" className="px-2 font-serif">
                {activePlayer === "lalo" ? "Lalo" : "Nacho"}
              </Badge>
            </div>
          </div>
          
          {/* Dialogue Log */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
            {activeMessages.map((msg) => {
              const isNpc = msg.role === "npc";
              const attitudeStyle = msg.attitude ? ATTITUDE_STYLES[msg.attitude] : null;

              return (
                <div
                  key={msg.id}
                  onClick={() => isNpc && msg.id !== "init" && setActiveMessageId(msg.id)}
                  className={`flex flex-col max-w-[85%] cursor-pointer ${isNpc ? "self-start" : "self-end items-end"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Text size="10px" className="text-gray-500 font-bold uppercase font-mono">
                      {isNpc ? currentNpc.name : activePlayer.toUpperCase()}
                    </Text>
                    {msg.action && (
                      <Badge size="xs" variant="outline" color="amber">{msg.action}</Badge>
                    )}
                    {isNpc && attitudeStyle && (
                      <Badge size="xs" style={{ backgroundColor: attitudeStyle.bg, color: attitudeStyle.color }}>
                        {attitudeStyle.label}
                      </Badge>
                    )}
                  </div>
                  
                  <div
                    className={`p-3.5 rounded-2xl border text-sm leading-relaxed ${
                      isNpc
                        ? activeMessageId === msg.id
                          ? "bg-[#1E293B] border-amber-500 shadow-md text-gray-100"
                          : "bg-[#1F2937] border-gray-800 text-gray-200 hover:border-gray-700"
                        : "bg-[#4F46E5] border-transparent text-white"
                    }`}
                  >
                    <Text size="sm">{msg.content}</Text>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Action Panel & Input Box */}
          <div className="p-4 bg-[#0F172A] border-t border-gray-800 flex flex-col gap-3 flex-shrink-0">
            {/* Action Selector */}
            <div className="flex gap-2 flex-wrap">
              {currentActions.map((action) => {
                const active = selectedAction === action.key;
                return (
                  <Tooltip key={action.key} label={action.description} position="top" withArrow>
                    <Button
                      size="xs"
                      onClick={() => setSelectedAction(action.key)}
                      variant={active ? "filled" : "outline"}
                      color={active ? "amber" : "gray"}
                      className="rounded-full transition-all text-xs font-serif font-bold"
                    >
                      {action.label}
                    </Button>
                  </Tooltip>
                );
              })}
            </div>

            {/* Chat input box */}
            <div className="flex gap-2 items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Action active: ${currentActions.find(a => a.key === selectedAction)?.label || "TALK"}. Type your interaction...`}
                rows={1}
                className="flex-1 bg-[#1F2937] border border-gray-800 text-sm text-gray-200 rounded-xl px-4 py-2.5 outline-none resize-none focus:border-amber-500/50"
              />
              <Button
                color="amber"
                onClick={handleSend}
                loading={isLoading}
                className="h-10 px-5 rounded-xl font-bold font-serif"
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: POLISHED INVESTIGATIVE INTERFACE WITH TABS */}
        <div className="w-[480px] border-l border-gray-800 bg-[#0F172A] flex flex-col overflow-hidden flex-shrink-0">
          
          {/* Tab buttons */}
          <div className="flex border-b border-gray-800 bg-[#0B0F19] flex-shrink-0">
            <button
              onClick={() => setActiveTab("brain")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all font-mono ${
                activeTab === "brain" ? "border-amber-500 text-amber-500 bg-[#0F172A]" : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              🧠 Brain
            </button>
            <button
              onClick={() => setActiveTab("graph")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all font-mono ${
                activeTab === "graph" ? "border-amber-500 text-amber-500 bg-[#0F172A]" : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              🕸️ Graph
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all font-mono ${
                activeTab === "timeline" ? "border-amber-500 text-amber-500 bg-[#0F172A]" : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              📜 Town Memory
            </button>
          </div>

          {/* Tab content area */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            
            {/* 1. BRAIN TAB */}
            {activeTab === "brain" && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {/* 1-2 Line Reasoning Card */}
                <div>
                  <Text className="text-[10px] text-amber-600 font-bold uppercase tracking-widest font-mono mb-1.5">NPC Reasoning</Text>
                  <div className="bg-[#0B0F19] border border-gray-800 p-3 rounded-xl">
                    {activeMessage?.reasoningChain ? (
                      <p className="text-xs text-gray-200 italic leading-relaxed">
                        {activeMessage.reasoningChain}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 italic text-center py-2">
                        Select a resident's message to inspect reasoning.
                      </p>
                    )}
                  </div>
                </div>

                {/* Retrieved memories list (simple plain text lines) */}
                <div>
                  <Text className="text-[10px] text-amber-600 font-bold uppercase tracking-widest font-mono mb-1.5">Retrieved Memories</Text>
                  <div className="bg-[#0B0F19] border border-gray-800 p-3 rounded-xl flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                    {activeMessage?.memories && activeMessage.memories.length > 0 ? (
                      activeMessage.memories.map((mem, index) => (
                        <div key={index} className="text-xs text-gray-300 flex items-start gap-2 border-b border-gray-900 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-amber-500">✓</span>
                          <span>{mem.text || mem}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic text-center py-2">
                        No specific memories retrieved for this message.
                      </p>
                    )}
                  </div>
                </div>

                {/* Relationship summary (simple plain text lines) */}
                <div>
                  <Text className="text-[10px] text-amber-600 font-bold uppercase tracking-widest font-mono mb-1.5">Relationship Summary</Text>
                  <div className="bg-[#0B0F19] border border-gray-800 p-3 rounded-xl flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                    {isMemoryLoading ? (
                      <Loader size="xs" color="amber" className="mx-auto py-2" />
                    ) : npcMemory?.known_relationships && npcMemory.known_relationships.length > 0 ? (
                      npcMemory.known_relationships.map((rel, index) => (
                        <div key={index} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-blue-400">♦</span>
                          <span>{rel}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic text-center py-2">
                        No relationships registered in memory.
                      </p>
                    )}
                  </div>
                </div>

                {/* Recent events (simple plain text lines) */}
                <div>
                  <Text className="text-[10px] text-amber-600 font-bold uppercase tracking-widest font-mono mb-1.5">Recent Events</Text>
                  <div className="bg-[#0B0F19] border border-gray-800 p-3 rounded-xl flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                    {isMemoryLoading ? (
                      <Loader size="xs" color="amber" className="mx-auto py-2" />
                    ) : npcMemory?.recent_memories && npcMemory.recent_memories.length > 0 ? (
                      npcMemory.recent_memories.map((mem, index) => (
                        <div key={index} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-orange-500">▪</span>
                          <span>{mem}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic text-center py-2">
                        No recent events cataloged.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. GRAPH TAB */}
            {activeTab === "graph" && (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                
                {/* Search and filter inputs */}
                <div className="p-3 bg-[#0B0F19] border-b border-gray-800 flex flex-col gap-2 flex-shrink-0 font-mono">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search nodes by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-[#1E293B] border border-gray-800 text-xs text-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-amber-500/50"
                    />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-[#1E293B] border border-gray-800 text-xs text-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-amber-500/50"
                    >
                      <option value="">All Categories</option>
                      {Object.keys(NODE_COLORS).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Filter by edge (e.g. knows, owns)..."
                      value={relationFilter}
                      onChange={(e) => setRelationFilter(e.target.value)}
                      className="flex-1 bg-[#1E293B] border border-gray-800 text-xs text-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-amber-500/50"
                    />
                    <Button size="xs" color="amber" onClick={fetchGraph} loading={isGraphLoading} className="font-serif">
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Graph Legend Overlay */}
                <div className="flex flex-wrap gap-2 px-3 py-2 bg-[#0B0F19]/40 border-b border-gray-900 justify-center flex-shrink-0">
                  {Object.entries(NODE_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[9px] text-gray-400 uppercase font-mono">{type}</span>
                    </div>
                  ))}
                </div>

                {/* Graph Container */}
                <div ref={graphContainerRef} className="flex-1 bg-black relative overflow-hidden">
                  {isGraphLoading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                      <Loader color="amber" size="sm" />
                    </div>
                  )}

                  {graphWidth > 0 && graphHeight > 0 && (
                    <ForceGraph2D
                      ref={graphRef}
                      width={graphWidth}
                      height={graphHeight}
                      graphData={displayGraphData}
                      backgroundColor="#000000"
                      // Particles flow along orange edges to represent active relations
                      linkDirectionalParticles={1.5}
                      linkDirectionalParticleWidth={1.2}
                      linkDirectionalParticleColor={() => "#FBBF24"}
                      linkDirectionalParticleSpeed={0.006}
                      cooldownTime={3000}
                      // Clicking canvas clears node selection
                      onBackgroundClick={() => setSelectedNode(null)}
                      // Bounding box hit detection for custom text box shapes
                      nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                        const label = node.label || node.id;
                        const fontSize = 11;
                        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
                        const textWidth = ctx.measureText(label).width;
                        const paddingX = 6;
                        const paddingY = 4;
                        const w = textWidth + paddingX * 2;
                        const h = fontSize + paddingY * 2;
                        
                        ctx.fillStyle = color;
                        ctx.fillRect(node.x - w / 2, node.y - h / 2, w, h);
                      }}
                      // Custom drawing: Nodes are simple readable boxes with text labels
                      nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                        const label = node.label || node.id;
                        const fontSize = 11;
                        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
                        const textWidth = ctx.measureText(label).width;
                        const paddingX = 6;
                        const paddingY = 4;
                        const w = textWidth + paddingX * 2;
                        const h = fontSize + paddingY * 2;
                        
                        const color = NODE_COLORS[node.type] || "#9CA3AF";
                        const isSelected = selectedNode?.id === node.id;
                        const isHovered = hoveredNode?.id === node.id;

                        // Draw shadow glow for selection
                        if (isSelected || isHovered) {
                          ctx.shadowColor = isSelected ? "#F59E0B" : color;
                          ctx.shadowBlur = 8;
                        }

                        // Background box (dark charcoal)
                        ctx.fillStyle = "#111827";
                        ctx.beginPath();
                        const x = node.x - w / 2;
                        const y = node.y - h / 2;
                        const r = 3; // border radius
                        ctx.moveTo(x + r, y);
                        ctx.lineTo(x + w - r, y);
                        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                        ctx.lineTo(x + w, y + h - r);
                        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                        ctx.lineTo(x + r, y + h);
                        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                        ctx.lineTo(x, y + r);
                        ctx.quadraticCurveTo(x, y, x + r, y);
                        ctx.closePath();
                        ctx.fill();

                        // Reset shadow settings
                        ctx.shadowBlur = 0;

                        // Node Border
                        ctx.strokeStyle = isSelected ? "#EA580C" : color;
                        ctx.lineWidth = isSelected ? 2 : 1;
                        ctx.stroke();

                        // Text Label inside Box
                        ctx.fillStyle = isSelected ? "#FBBF24" : "#F3F4F6";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(label, node.x, node.y);
                      }}
                      onNodeHover={(node) => setHoveredNode(node)}
                      onNodeClick={(node) => setSelectedNode(node)}
                      // Custom Link Drawing
                      linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                        const start = link.source;
                        const end = link.target;
                        if (typeof start !== "object" || typeof end !== "object") return;
                        
                        // Line
                        ctx.beginPath();
                        ctx.moveTo(start.x, start.y);
                        ctx.lineTo(end.x, end.y);
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "rgba(234, 88, 12, 0.4)"; // Soft orange link
                        ctx.stroke();
                        
                        // Link relation labels centered, shown on high zoom or if hovered
                        const isHovered = hoveredNode?.id === start.id || hoveredNode?.id === end.id;
                        if (globalScale > 1.8 || isHovered) {
                          const midX = (start.x + end.x) / 2;
                          const midY = (start.y + end.y) / 2;
                          const label = link.type || "";
                          const fSize = Math.max(2.5, 7.5 / globalScale);
                          
                          ctx.font = `${fSize}px monospace`;
                          ctx.textAlign = "center";
                          ctx.textBaseline = "middle";
                          
                          // Label backdrop box
                          const textWidth = ctx.measureText(label).width;
                          ctx.fillStyle = "rgba(11, 15, 25, 0.85)";
                          ctx.fillRect(midX - textWidth / 2 - 1, midY - fSize / 2 - 1, textWidth + 2, fSize + 2);
                          
                          ctx.fillStyle = "#EA580C";
                          ctx.fillText(label, midX, midY);
                        }
                      }}
                    />
                  )}
                </div>

                {/* SIDE INSPECTOR OVERLAY */}
                {selectedNode && inspectorData && (
                  <div className="absolute top-0 right-0 w-80 h-full bg-[#0F172A] border-l border-gray-800 shadow-2xl p-4 overflow-y-auto flex flex-col gap-4 z-20 animate-slide-in text-xs">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2 flex-shrink-0">
                      <div>
                        <Text size="10px" className="font-mono text-gray-500 uppercase tracking-widest">{inspectorData.type}</Text>
                        <Text className="font-serif font-bold text-amber-500 text-base">{inspectorData.name}</Text>
                      </div>
                      <CloseButton size="xs" onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white" />
                    </div>

                    <div className="flex flex-col gap-4 flex-1">
                      {/* Description */}
                      <div>
                        <Text className="text-[10px] text-amber-600 font-bold uppercase tracking-widest font-mono mb-1">Description</Text>
                        <p className="bg-[#0B0F19] p-2.5 rounded border border-gray-800 text-gray-300 leading-relaxed italic">
                          {inspectorData.description}
                        </p>
                      </div>

                      {/* Current Trust (if NPC) */}
                      {inspectorData.type === "NPC" && (
                        <div>
                          <Text className="text-[10px] text-amber-600 font-bold uppercase tracking-widest font-mono mb-1">Current Trust</Text>
                          <div className="bg-[#0B0F19] p-2 rounded border border-gray-800 flex justify-between font-mono text-[11px]">
                            <div>Lalo: <span className="font-bold text-amber-500">{npcState[selectedNode.id.toLowerCase()]?.trust_lalo ?? 0}</span></div>
                            <div>Nacho: <span className="font-bold text-amber-500">{npcState[selectedNode.id.toLowerCase()]?.trust_nacho ?? 0}</span></div>
                          </div>
                        </div>
                      )}

                      {/* Connected NPCs */}
                      {inspectorData.connectedNpcs.length > 0 && (
                        <div>
                          <Text className="text-[10px] text-amber-600 font-bold uppercase tracking-widest font-mono mb-1">Connected NPCs</Text>
                          <div className="flex flex-wrap gap-1">
                            {inspectorData.connectedNpcs.map(npc => (
                              <Badge key={npc} color="blue" size="xs">{npc}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Known Rumors */}
                      {inspectorData.knownRumors.length > 0 && (
                        <div>
                          <Text className="text-[10px] text-amber-600 font-bold uppercase tracking-widest font-mono mb-1">Known Rumors</Text>
                          <div className="bg-[#0B0F19] p-2 rounded border border-gray-800 flex flex-col gap-1 max-h-[100px] overflow-y-auto">
                            {inspectorData.knownRumors.map((rumor, i) => (
                              <div key={i} className="text-[11px] text-gray-300">• {rumor}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Known Crimes */}
                      {inspectorData.knownCrimes.length > 0 && (
                        <div>
                          <Text className="text-[10px] text-amber-600 font-bold uppercase tracking-widest font-mono mb-1">Known Crimes</Text>
                          <div className="bg-[#0B0F19] p-2 rounded border border-gray-800 flex flex-col gap-1 max-h-[100px] overflow-y-auto">
                            {inspectorData.knownCrimes.map((crime, i) => (
                              <div key={i} className="text-[11px] text-red-400">• {crime}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Connected Edges */}
                      <div>
                        <Text className="text-[10px] text-amber-600 font-bold uppercase tracking-widest font-mono mb-1">Connected Edges</Text>
                        <div className="bg-[#0B0F19] p-2 rounded border border-gray-800 flex flex-col gap-1.5 max-h-[120px] overflow-y-auto font-mono text-[10px]">
                          {inspectorData.allConnected.map((rel, i) => (
                            <div key={i} className="text-gray-300 pb-1 border-b border-gray-900 last:border-0">
                              <span className="text-amber-500">{rel.source}</span>
                              <span className="text-gray-500 mx-1">→</span>
                              <span className="text-amber-500">{rel.target}</span>
                              <div className="text-[9px] text-amber-600/80 uppercase font-bold mt-0.5">{rel.type}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Importance & Metadata */}
                      <div className="flex gap-4 font-mono text-[10px] text-gray-400 mt-auto pt-2 border-t border-gray-800 flex-shrink-0">
                        <div>IMPORTANCE: <span className="font-bold text-gray-200">{inspectorData.importance}</span></div>
                        <div>UPDATED: <span className="font-bold text-gray-200">{inspectorData.lastUpdated}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. TIMELINE TAB */}
            {activeTab === "timeline" && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {isTownMemoriesLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
                    <Loader color="amber" size="sm" />
                    <Text size="xs" color="gray" className="italic font-mono">Reading town logs...</Text>
                  </div>
                ) : townMemories.length > 0 ? (
                  <div className="relative pl-6 border-l border-amber-900/20 ml-2 flex flex-col gap-6">
                    {Object.entries(timelineGroups).map(([group, list]) => (
                      <div key={group} className="flex flex-col gap-3">
                        {/* Timeline Group Header (e.g. Today, Yesterday) */}
                        <div className="relative">
                          <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-[#0F172A]" />
                          <Text className="font-serif font-bold text-sm text-amber-500">{group}</Text>
                        </div>

                        {/* Event cards in this day */}
                        <div className="flex flex-col gap-2.5">
                          {list.map((mem, index) => (
                            <div key={index} className="bg-[#1E293B]/60 border border-gray-800 p-3 rounded-xl flex flex-col gap-1.5">
                              {/* Card Metadata Header */}
                              <div className="flex justify-between items-center font-mono text-[9px] text-gray-400">
                                <div className="flex gap-1.5 items-center">
                                  <Badge size="xs" color="gray" variant="outline">{mem.source}</Badge>
                                  <Badge size="xs" color="dark">{mem.category}</Badge>
                                </div>
                                <div className="flex gap-1.5 items-center">
                                  <span className="text-emerald-500 font-bold">{mem.confidence}% Conf.</span>
                                  <span className={
                                    mem.importance === "Critical" ? "text-red-500 font-bold" :
                                    mem.importance === "High" ? "text-orange-500" :
                                    mem.importance === "Medium" ? "text-amber-500" : "text-gray-500"
                                  }>{mem.importance}</span>
                                </div>
                              </div>

                              {/* Memory content */}
                              <Text size="xs" className="text-gray-200 leading-relaxed font-serif">
                                {mem.text}
                              </Text>

                              {/* Participants List */}
                              {mem.participants && mem.participants.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 items-center">
                                  <span className="text-[9px] uppercase font-bold text-gray-500 font-mono mr-1">Involved:</span>
                                  {mem.participants.map((p: string) => (
                                    <span key={p} className="bg-[#0B0F19] border border-gray-800 text-[10px] px-2 py-0.5 rounded-full text-gray-300 font-serif">
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic text-center py-8">
                    No town shared memories consolidated yet. Perform actions or consolidate memory!
                  </p>
                )}
              </div>
            )}

          </div>

          <Divider color="gray" className="flex-shrink-0" />

          {/* TOWN CONTROLS FOOTER */}
          <div className="p-4 bg-[#0B0F19] border-t border-gray-800 flex flex-col gap-2 flex-shrink-0">
            <Button
              color="teal"
              onClick={handleConsolidate}
              loading={isConsolidating}
              className="w-full font-bold font-serif"
            >
              Consolidate Town Memory
            </Button>
            <Button
              color="red"
              variant="outline"
              onClick={handleReset}
              loading={isWiping}
              className="w-full font-bold font-serif"
            >
              Town Amnesia (Reset)
            </Button>
          </div>

          {/* Live status alert container */}
          {statusMessage && (
            <div className={`m-3 p-2.5 rounded-lg border text-xs text-center font-medium font-mono ${
              statusMessage.type === "success" ? "bg-emerald-950/80 border-emerald-500 text-emerald-300" :
              statusMessage.type === "error" ? "bg-red-950/80 border-red-500 text-red-300" :
              "bg-blue-950/80 border-blue-500 text-blue-300"
            }`}>
              {statusMessage.text}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
