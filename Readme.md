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

# Demo

> *(Insert demo GIF here)*

---

# Screenshots

| Chat | Knowledge Graph |
|------|-----------------|
| ![](ss/chat.png) | ![](ss/graph.png) |

| Brain Inspector | Town Memory |
|-----------------|-------------|
| ![](ss/brain.png) | ![](ss/town-memory.png) |

---

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

- Cognee ❤️
- FastAPI
- Next.js
- React
- TypeScript
- LiteLLM
- FastEmbed
- D3.js

---

# Acknowledgements

Built for the **Cognee Hackathon 2026**.

The goal of this project is to explore how persistent memory can transform game NPCs from scripted dialogue machines into believable characters whose memories, relationships, and shared experiences genuinely shape the world around them.