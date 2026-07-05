import os
from dotenv import load_dotenv

# Pre-load environment and force LLM_PROVIDER to openai
# to bypass Cognee's enum validator, allowing LiteLLM to route the groq/ model.
load_dotenv()
os.environ["LLM_PROVIDER"] = "openai"

# Configure Cognee to use localized database directories inside the project
backend_dir = os.path.abspath(os.path.dirname(__file__))
os.environ["SYSTEM_ROOT_DIRECTORY"] = os.path.join(backend_dir, ".cognee_system")
os.environ["DATA_ROOT_DIRECTORY"] = os.path.join(backend_dir, ".cognee_data")

STATE_DIR = "state"
STATE_FILE = os.path.join(STATE_DIR, "state.json")

