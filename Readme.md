# 🤠 Silver Creeks

> **Silver Creeks** is an AI-powered NPC memory simulation built for the **Cognee Hackathon 2026**.
>
> Instead of NPCs behaving like stateless chatbots, every character has persistent memory, remembers previous conversations, spreads rumors, forms opinions, and influences future gameplay using **Cognee's hybrid graph-vector memory layer**.

---

# Inspiration

I've always loved immersive open-world games like **Red Dead Redemption 2**, **GTA V**, **Skyrim**, and **Genshin Impact**.

They create incredible worlds, but one thing always felt missing.

No matter how many times you talk to an NPC, the interaction is almost always the same.

You can save a town, rob a bank, expose a criminal, or become famous, yet most NPCs forget everything the moment the conversation ends.

I wanted to answer one question:

> **What if NPCs actually remembered?**

Not just chat history.

Real memory.

Memory that spreads.

Memory that changes opinions.

Memory that permanently changes how the world reacts to the player.

That is what Silver Creeks explores using **Cognee**.

---

# The Idea

Silver Creeks is a small living town where every resident has their own long-term memory.

Instead of scripting dialogue trees, every interaction becomes knowledge.

NPCs can:

- remember conversations
- recall previous encounters
- spread gossip
- share information
- build trust
- lose trust
- influence each other's beliefs
- react differently as the story evolves

Every conversation permanently changes the world.

---

# Screenshots

## 💬 NPC Conversations

Natural conversations where every NPC recalls previous interactions before responding.

![Chat UI](./ss/Screenshot%202026-07-05%20215437.png)

---

## 🕸️ Dynamic Knowledge Graph

Every remembered interaction contributes to a live knowledge graph showing relationships between NPCs, locations, rumors, and events.

![Knowledge Graph](./ss/Screenshot%202026-07-05%20231601.png)

---

## 🧠 NPC Brain Inspector

Inspect exactly what memories were retrieved from Cognee before an NPC generated its response, making the system transparent instead of a black box.

![Brain Inspector](./ss/Screenshot%202026-07-06%20001412.png)

---

## 👥 Persistent Conversations

NPCs remember previous interactions, allowing conversations to evolve naturally instead of resetting every session.

![Conversation](./ss/Screenshot%202026-07-06%20001635.png)

---

## 🔗 Relationship & Memory Graph

The graph continuously evolves as players interact with the town, revealing how information propagates between characters.

![Relationship Graph](./ss/Screenshot%202026-07-06%20001643.png)

---

## 📜 Town Memory Timeline

View the complete timeline of important events remembered by the town, including conversations, rumors, investigations, and player actions.

![Town Timeline](./ss/Screenshot%202026-07-06%20001646.png)

---

## ⚡ Memory Consolidation

Demonstrates Cognee's `improve()` lifecycle operation by consolidating and enriching important memories for better future retrieval.

![Memory Consolidation](./ss/Screenshot%202026-07-06%20002558.png)

---

## 🗑️ Town Amnesia

Demonstrates Cognee's `forget()` operation by selectively clearing persistent memories while leaving the application itself intact.

![Town Amnesia](./ss/Screenshot%202026-07-06%20002608.png)

# How Cognee Powers Everything

Cognee is not simply used as a vector database.

It is the **entire memory layer** behind Silver Creeks.

Every important interaction passes through Cognee's memory lifecycle.

---

## 📝 remember()

Every meaningful event is stored as persistent memory.

Examples include:

- conversations
- rumors
- attacks
- thefts
- investigations
- purchases
- treatments
- player actions

Used inside:

```
backend/services/memory_service.py
```

via

```python
remember_event(...)
```

which wraps

```python
cognee.remember(...)
```

Each NPC stores memories inside its own dataset while important events can also be stored inside a shared town dataset.

---

## 🔍 recall()

Before generating every AI response, the NPC retrieves memories from Cognee.

Instead of only seeing the current prompt, the LLM receives:

- previous conversations
- shared rumors
- known relationships
- important events
- player reputation

Used in

```
memory_service.py

↓

recall_context()

↓

cognee.recall()
```

This is what allows conversations to continue naturally across sessions.

---

## 🧠 improve()

As more conversations happen, important memories are consolidated.

Rather than storing hundreds of duplicate events, Cognee enriches and strengthens useful knowledge.

This improves retrieval quality while reducing noise.

Triggered through

```
Improve Memory

↓

memory_service.py

↓

cognee.improve()
```

---

## 🗑 forget()

The project includes **Town Amnesia**, demonstrating Cognee's ability to selectively remove memory.

Instead of deleting the application state, only the persistent knowledge is forgotten.

Used by

```
Town Amnesia Button

↓

memory_service.py

↓

cognee.forget()
```

---

# Knowledge Graph

Every memory stored by Cognee contributes to a dynamic knowledge graph.

The graph visualizes:

- NPC relationships
- locations
- player interactions
- shared memories
- rumors
- investigations
- events

The backend contracts noisy intermediate graph nodes into readable storytelling relationships so the visualization remains understandable.

Example:

Instead of

```
Conversation

↓

Event

↓

Relationship

↓

Wade
```

the graph becomes

```
Lalo

attacked

↓

Wade
```

making the world easier to explore.

---

# NPC Brain Inspector

One of my favorite features.

Every NPC exposes the exact memory retrieved from Cognee before generating its response.

You can inspect:

- recalled memories
- current trust
- current opinion
- town memories
- knowledge sources
- retrieved context

This makes the AI explainable instead of acting like a black box.

---

# Architecture

![](ss/architecture.png)

```
                 Next.js Frontend
                         │
                         ▼
                  FastAPI Backend
        ┌──────────────┼───────────────┐
        │              │               │
 AI Service    Memory Service   Graph Service
        │              │               │
        └──────────────┼───────────────┘
                       │
                    Cognee
      remember • recall • improve • forget
                       │
                       ▼
         Hybrid Graph + Vector Memory
                       │
                       ▼
       NPC Responses + Knowledge Graph
```

---

# Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Mantine
- D3.js

## Backend

- FastAPI
- Python
- LiteLLM
- Instructor

## Memory Layer

- Cognee
- FastEmbed
- Hybrid Graph + Vector Retrieval

---

# Running Locally

## Backend

```bash
cd backend

pip install -r requirements.txt

python main.py
```

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Challenges

Building believable AI memory turned out to be much harder than generating AI responses.

Some of the biggest challenges included:

- keeping memories relevant
- preventing duplicate memories
- separating private vs shared knowledge
- making graph retrieval understandable
- natural rumor propagation
- maintaining consistent trust
- simplifying noisy graph structures
- keeping retrieval fast

---

# Limitations

This project was built **solo** during the hackathon.

Because of the limited time available, several planned features couldn't be fully completed.

Future improvements include:

- autonomous NPC-to-NPC conversations
- daily schedules
- memory confidence
- dynamic economy
- more NPC actions
- larger towns
- better graph analytics

Even so, the current prototype demonstrates how Cognee can fundamentally change NPC interactions by giving AI persistent memory instead of stateless conversations.

---

# Future Work

- Autonomous NPC conversations
- Procedural quests
- Memory confidence scoring
- Dynamic economy
- Multiple towns
- Voice interaction
- Multiplayer worlds

---

# Built With

- Cognee 
- FastAPI
- Next.js
- React
- TypeScript
- LiteLLM
- FastEmbed
- D3.js

---

# Hackathon Experience

Silver Creeks was built as a solo project during the Cognee Hackathon 2026.

My goal wasn't just to build another chatbot—it was to explore what happens when NPCs stop forgetting. Most of my time was spent understanding Cognee's memory lifecycle and designing a system where memories could be stored, retrieved, shared, consolidated, and visualized in a way that felt meaningful for gameplay.

The biggest challenge wasn't generating AI responses—it was managing persistent memory. I spent a significant amount of time reducing duplicate memories, making the knowledge graph readable, separating private NPC memories from shared town memories, and ensuring recalled context actually influenced future conversations.

While I couldn't implement every feature I envisioned, the hackathon pushed me to build a complete end-to-end system that combines persistent AI memory, graph visualization, reputation mechanics, and evolving NPC interactions. It also gave me hands-on experience integrating Cognee's `remember()`, `recall()`, `improve()`, and `forget()` lifecycle into a practical application.

This project is a prototype, but it demonstrates how persistent memory can make AI-driven game worlds feel significantly more alive and believable.

# Acknowledgements

Built for the **Cognee Hackathon 2026**.

The goal of this project is to explore how persistent memory can transform game NPCs from scripted dialogue machines into believable characters whose memories, relationships, and shared experiences genuinely shape the world around them.

**Development Note:** This project was developed with assistance from **Antigravity IDE**, **ChatGPT**, and **Google Gemini 2.5** for brainstorming, code generation, debugging, refactoring, and error resolution. All architectural decisions, feature design, integration, and final implementation were directed, reviewed, and validated by me.
