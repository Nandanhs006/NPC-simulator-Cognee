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
High-level architecture and data-flow diagrams are included in `docs/` to help orient contributors.

![High Level Architecture](docs/architecture_high_level.svg)

![Data Flow](docs/data_flow.svg)

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
