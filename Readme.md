# NPC — Narrative NPC System

This repository contains a narrative NPC system: backend services, data models, and a Next.js frontend for interacting with simulated NPCs. It is designed for experimentation with memory, reputation, graph-based world modeling, and AI-driven dialogue.

## Highlights
- Modular backend with model abstractions: `models/` (graph, memory, npc, world).
- Services layer: AI, graph service, memory service, reputation and propagation logic (`backend/services`).
- Next.js frontend (`frontend/src`) providing an interactive chat UI and graph visualizations.

## Quick Start
Prerequisites: Python 3.10+, Node 18+, and optionally a virtual environment tool.

Backend (run from repository root):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python backend/main.py
```

Frontend (from repository root):

```bash
cd frontend
pnpm install    # or npm install
pnpm dev        # or npm run dev
```

## Architecture

This project follows a simple, modular architecture composed of three layers:

- Frontend: the Next.js app under `frontend/` that provides the chat UI and graph visualizations. It communicates with the backend over HTTP (REST) or WebSocket.
- Backend / Services: the application logic under `backend/` including routers and services. The routers (in `backend/routers/`) translate HTTP requests into service calls; the services (in `backend/services/`) orchestrate AI calls, graph operations, memory management, and reputation/propagation logic.
- Models & State: domain models in `backend/models/` (NPC, World, Memory, Graph, Response) encapsulate core behavior and persistence. Lightweight state is kept in `state/state.json` and `backend/seeded.txt` for local experiments.

Data flows typically look like:

User (browser) -> Frontend -> Router/API -> Services -> Models/State

The Services layer may synchronously call AI models or perform asynchronous updates to the world model. Models serialize important state to disk so the simulation can be resumed.

## Simulation (use your API key)
You can simulate a conversation scenario locally by sending the example messages below to your running backend. Do NOT include an actual secret in the repository — set your API key as an environment variable before running the backend.

1. Set your API key in the environment (example for PowerShell):

```powershell
$env:OPENAI_API_KEY = "YOUR_API_KEY_HERE"
# then start the backend in the same session
python backend/main.py
```

2. Example `curl` to POST a simulation payload to a typical chat endpoint (`/api/chat`). Adjust the URL/field names to match your backend implementation.

```bash
curl -X POST http://localhost:8000/api/chat \
	-H "Content-Type: application/json" \
	-d '{"session": "demo", "messages": [
		{"role":"user","text":"Last night I saw Wade Granger sneak into Victor Sterling\'s bank after closing. I think he stole a bag of cash."},
		{"role":"user","text":"I heard Wade Granger robbed Victor Sterling\'s bank. Buck at the IronOak was talking about it."}
	]}'
```

3. The example scenario (dialogue lines) below is the same content previously in `test.md`. You can paste these as messages into your client or include them in the JSON `messages` array when calling the chat endpoint.

```
[Lalo → Bartender Buck | Talk]
"Last night I saw Wade Granger sneak into Victor Sterling's bank after closing. I think he stole a bag of cash."

[Nacho → Sheriff Jeremiah Ashcroft | Talk]
"I heard Wade Granger robbed Victor Sterling's bank. Buck at the IronOak was talking about it."

[Lalo → Victor Sterling | Talk]
"Victor, I heard someone broke into your bank. People are saying Wade Granger was responsible."

[Nacho → Wade Granger | Talk]
"Wade, folks around Silver Creeks are saying you robbed Victor Sterling's bank last night. What really happened?"

[Lalo → Doctor Isaac Vance | Talk]
"Doctor, have you heard the rumors? Everyone thinks Wade stole from Victor Sterling."

[Nacho → Ruth Hayes | Talk]
"Ruth, everyone at the IronOak keeps saying Wade robbed the bank."

[Lalo → Sheriff Jeremiah Ashcroft | Talk]
"Has your investigation uncovered anything about the bank robbery?"

[Nacho → Bartender Buck | Talk]
"People are repeating the story you heard about Wade stealing from Victor Sterling. Is there any new information?"

[Lalo → Victor Sterling | Talk]
"Have you questioned Wade yet? The whole town seems convinced."

[Nacho → Doctor Isaac Vance | Talk]
"Do you think Wade would really steal from Victor Sterling?"

[Lalo → Wade Granger | Talk]
"Wade, the sheriff is looking into the robbery. Everyone keeps mentioning your name."

[Nacho → Sheriff Jeremiah Ashcroft | Investigate]
"I want to know whether Wade Granger actually stole from Victor Sterling."

[Lalo → Bartender Buck | Talk]
"The rumors are spreading quickly. Nearly everyone believes Wade robbed the bank."

[Nacho → Victor Sterling | Talk]
"Did the sheriff recover your stolen money yet?"

[Lalo → Sheriff Jeremiah Ashcroft | Talk]
"Based on everything you've heard around town, who do you believe was responsible for the robbery?"
```

> Note: Replace `YOUR_API_KEY_HERE` with your actual API key in the environment variable before starting the backend. Never commit API keys to source control.

## Screenshots
The following screenshots demonstrate the UI and developer views. Files are in the `ss/` folder.

- **Chat UI**
	![Chat UI](ss/Screenshot%202026-07-05%20215437.png)

- **Chat + Graph**
	![Chat + Graph](ss/Screenshot%202026-07-05%20231601.png)

- **NPC Interaction 1**
	![NPC Interaction 1](ss/Screenshot%202026-07-06%20001412.png)

- **NPC Interaction 2**
	![NPC Interaction 2](ss/Screenshot%202026-07-06%20001635.png)

- **Graph Detail**
	![Graph Detail](ss/Screenshot%202026-07-06%20001643.png)

- **State / Logs View**
	![State View](ss/Screenshot%202026-07-06%20001646.png)

## Project Layout
- `backend/` — server entry, services, models, prompts and routers.
- `frontend/` — Next.js app with chat UI and utility modules.
- `state/` — example `state.json` used by the server.

## Contributing
- Fork and open a PR for feature changes.
- Keep changes focused: update `backend/` services, `models/`, or `frontend/` modules.
- Add or update diagrams in `docs/` when architecture changes.

## Notes & Next Steps
- If you plan to run the system locally, seed files are under `backend/seeded.txt` and `state/state.json`.
- Consider adding CI checks and a `docker-compose` dev setup for easier onboarding.

---

If you'd like, I can also:
- add a small `docker-compose.yml` for local development,
- generate PNG exports of the SVG diagrams,
- or update the `backend/main.py` usage documentation.
