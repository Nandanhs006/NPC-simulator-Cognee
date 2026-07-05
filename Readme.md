# 🤠 Silver Creeks

> **Silver Creeks** is an AI-powered NPC memory simulation built for the **Cognee Hackathon 2026**. Instead of treating NPCs as stateless chatbots, every character maintains persistent memories, recalls past interactions, spreads information naturally through a town-wide knowledge graph, and evolves over time using Cognee's hybrid graph-vector memory layer.

---

# Demo

> *(Add demo GIF here)*

---

# Screenshots

*(Add screenshots of Chat, Brain Inspector, Knowledge Graph and Town Memory)*

---

# Inspiration

Traditional AI NPCs forget everything once a conversation ends.

I wanted to explore what happens if every NPC could permanently remember conversations, share information with others, and develop opinions based on previous interactions.

Rather than scripting every interaction, I used Cognee to create persistent memories that influence future conversations.

---

# What it does

Silver Creeks simulates a living town where every NPC has long-term memory.

Players interact with multiple residents, perform actions, spread rumors, build trust, or damage relationships. Those interactions are remembered, propagated, and later recalled by other NPCs—even if they were never directly involved.

The application combines:

- Persistent NPC memory
- Shared town memory
- Knowledge graph visualization
- Dynamic trust & reputation
- Gossip propagation
- Memory inspection
- Memory consolidation
- Interactive conversations

---

# Powered by Cognee

Cognee acts as the persistent memory layer for the entire simulation.

Instead of manually storing conversation history, every interaction flows through Cognee's memory lifecycle.

### remember()

Stores conversations, rumors, attacks, thefts, investigations, purchases and other significant events as structured memories.

### recall()

Retrieves the most relevant memories before every NPC response, allowing conversations to continue naturally across sessions.

### improve()

Consolidates important memories into a shared town dataset, strengthening relationships and enriching future retrieval.

### forget()

Allows the entire town memory to be reset while preserving the application itself.

---

# Knowledge Graph

Every memory stored through Cognee contributes to a dynamic knowledge graph.

The graph visualizes:

- NPC relationships
- Player interactions
- Shared memories
- Rumors
- Events
- Locations

Rather than exposing raw graph nodes generated during ingestion, the backend contracts generic event nodes into meaningful relationships, making the graph readable and useful for users.

---

# How it works

```
Player Action
      │
      ▼
FastAPI Backend
      │
      ▼
Cognee remember()
      │
      ▼
NPC Dataset
      │
      ▼
Town Memory
      │
      ▼
Knowledge Graph
      │
      ▼
Future NPC Responses
```

Every NPC first retrieves memories from Cognee before generating a response, allowing previous conversations to influence future behavior.

---

# Architecture

```
Frontend (Next.js)

        │

        ▼

FastAPI Backend

 ├── AI Service
 ├── Memory Service
 ├── Graph Service
 ├── Reputation Service
 └── Propagation Service

        │

        ▼

      Cognee

remember()
recall()
improve()
forget()

        │

        ▼

Hybrid Graph + Vector Memory
```

---

# Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Mantine UI
- D3.js

### Backend

- FastAPI
- Python
- LiteLLM
- Instructor

### Memory

- Cognee
- FastEmbed
- Hybrid Graph + Vector Retrieval

---

# Project Structure

```
backend/
    models/
    routers/
    services/
    prompts/
    utils/
    state/

frontend/
    app/
    components/
```

---

# Running Locally

## Backend

```bash
pip install -r requirements.txt
python main.py
```

## Frontend

```bash
npm install
npm run dev
```

---

# Environment Variables

Create a `.env` file inside the backend directory.

```env
OPENAI_API_KEY=your_api_key

LLM_PROVIDER="openai"
LLM_MODEL="groq/meta-llama/llama-4-scout-17b-16e-instruct"

LLM_INSTRUCTOR_MODE="json_mode"

EMBEDDING_PROVIDER="fastembed"
EMBEDDING_MODEL="BAAI/bge-small-en-v1.5"
EMBEDDING_DIMENSIONS=384

CORS_ALLOWED_ORIGINS="http://localhost:3000"
```

---

# Challenges

Building persistent AI behavior turned out to be much more challenging than generating responses.

Some of the key problems I worked through included:

- Preventing duplicate memories
- Cleaning noisy graph structures
- Making knowledge graphs readable
- Managing shared versus private memory
- Propagating rumors naturally
- Maintaining relationship consistency across multiple NPCs
- Keeping retrieval relevant as memories accumulated

---

# Limitations

This project was developed **solo** during the hackathon.

Because of time constraints, several planned features are either simplified or incomplete, including:

- More sophisticated rumor confidence
- Daily NPC routines
- Memory confidence decay
- Dynamic economy
- Richer graph analytics
- Additional NPC actions and interactions

Despite these limitations, the project demonstrates how Cognee can serve as a persistent memory layer for AI-driven simulations and interactive worlds.

---

# Future Work

- Memory confidence scoring
- Temporal reasoning
- Autonomous NPC-to-NPC conversations
- Dynamic schedules
- Multi-town simulations
- Quest generation
- Voice interaction
- Multiplayer support

---

# Acknowledgements

Built for the **Cognee Hackathon 2026** using:

- Cognee
- FastAPI
- Next.js
- D3.js
- LiteLLM
- FastEmbed