"""All settings in one place. Values come from agent/.env"""

import os
from pathlib import Path

from dotenv import load_dotenv

AGENT_DIR = Path(__file__).parent.parent
load_dotenv(AGENT_DIR / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

# The only website the agent is allowed to open
WORKSPACE_URL = os.getenv("WORKSPACE_URL", "http://localhost:5173")

HEADLESS = os.getenv("HEADLESS") == "1"  # 1 = hide the browser window
MAX_STEPS = int(os.getenv("MAX_STEPS", "25"))  # stop runaway runs (and costs)
KEEP_PAGES = 3  # how many recent pages the LLM sees in full

RUNS_DIR = AGENT_DIR / "runs"  # screenshots + report.json for every run
PLAYBOOKS_FILE = AGENT_DIR / "data" / "playbooks.json"
