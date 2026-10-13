"""
PLAYBOOKS = the agent learning from experience.

After a VERIFIED success, the LLM writes down how it did the task in general
terms (<vendor>, <invoice number>) plus the problems it hit. Next time the
playbooks go into the prompt, so a similar task is faster and avoids the same
mistakes. Stored in a simple JSON file.
"""

import json

from pydantic import BaseModel, Field

from . import config


class Playbook(BaseModel):
    title: str = Field(description="Short name of this kind of task")
    when_to_use: str
    steps: list[str] = Field(description="4 to 8 general steps, with placeholders like <vendor>")
    gotchas: list[str] = Field(description="Problems hit this time and how to avoid them up front")


def load_playbooks() -> list[dict]:
    if config.PLAYBOOKS_FILE.exists():
        return json.loads(config.PLAYBOOKS_FILE.read_text())
    return []


def playbooks_text(playbooks: list[dict]) -> str:
    """Turn playbooks into text for the system prompt."""
    if not playbooks:
        return ""
    return "\n\nPlaybooks from earlier successful tasks (use one if it fits):\n" + json.dumps(playbooks, indent=2)


def learn_playbook(task: str, steps: list[dict]) -> dict:
    from .agent import chat_model

    history = "\n".join(f"{i + 1}. {s['tool']} {json.dumps(s['args'])} → {s['result']}" for i, s in enumerate(steps))

    # with_structured_output makes the LLM answer in exactly the Playbook shape
    playbook = (
        chat_model()
        .with_structured_output(Playbook)
        .invoke(f"Write a reusable playbook from this successful task.\n\nTask: {task}\n\nWhat the agent did:\n{history}")
        .model_dump()
    )

    # Replace an old playbook with the same title, otherwise add it
    others = [p for p in load_playbooks() if p["title"] != playbook["title"]]
    config.PLAYBOOKS_FILE.parent.mkdir(exist_ok=True)
    config.PLAYBOOKS_FILE.write_text(json.dumps(others + [playbook], indent=2))
    return playbook
