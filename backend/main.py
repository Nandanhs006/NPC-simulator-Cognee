# Load environment configuration first (forces LLM_PROVIDER, loads .env)
import config  # noqa: F401

import os
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from cognee.api.client import app

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modular APIRouters
from routers.chat import router as chat_router
from routers.graph import router as graph_router
from routers.memory import router as memory_router

app.include_router(chat_router)
app.include_router(graph_router)
app.include_router(memory_router)

@app.on_event("startup")
async def startup_event():
    try:
        # Ensure database directories exist before setup
        sys_dir = os.environ.get("SYSTEM_ROOT_DIRECTORY")
        data_dir = os.environ.get("DATA_ROOT_DIRECTORY")
        if sys_dir:
            os.makedirs(sys_dir, exist_ok=True)
        if data_dir:
            os.makedirs(data_dir, exist_ok=True)
        
        from cognee.modules.engine.operations.setup import setup
        from cognee.modules.users.methods import get_default_user
        from services.memory_service import seed_lore_if_needed
        
        await setup()
        user = await get_default_user()
        await seed_lore_if_needed(user)
        print("Startup database initialization completed successfully.")
    except Exception as e:
        print(f"Startup database initialization error: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
