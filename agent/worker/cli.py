"""
Run from the terminal (inside the agent folder):

    uv run python -m worker.cli "Do what Priya asked in her latest email"
"""

import os
import sys

from . import config
from .agent import run_task
from .run import Human


class You(Human):
    """The human in the loop = you, typing in the terminal."""

    def approve(self, action, reason):
        print(f"\n🛑 APPROVAL NEEDED: {action}\n   Why: {reason}\n   (check the form in the browser window)")
        return input("Approve? (y/n) ").strip().lower() == "y"

    def ask(self, question):
        print(f"\n❓ AGENT ASKS: {question}")
        return input("Your answer: ")


class Robot(Human):
    """For automated tests only: approves everything, can't answer questions."""

    def approve(self, action, reason):
        return True

    def ask(self, question):
        return "Nobody is available. Finish with status needs_user."


ICONS = {"think": "💭", "action": "👉", "result": "  ✓", "memory": "🧠", "warn": "⚠️ ", "verify": "🔍", "done": "🏁"}


def log(kind, text):
    print(f"{ICONS[kind]} {text}")


if __name__ == "__main__":
    if not config.OPENAI_API_KEY:
        sys.exit("OPENAI_API_KEY is missing. Add it to agent/.env")
    task = " ".join(sys.argv[1:])
    if not task:
        sys.exit('Usage: uv run python -m worker.cli "what you want done"')
    human = Robot() if os.getenv("AUTO_APPROVE") == "1" else You()
    run_task(task, human, log)
