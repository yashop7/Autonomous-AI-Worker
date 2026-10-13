"""The data shared by everything during one task run."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

from .browser import Browser


class Human:
    """Who the agent asks for approval or answers. The CLI and dashboard implement this."""

    def approve(self, action: str, reason: str) -> bool: ...
    def ask(self, question: str) -> str: ...


@dataclass
class Run:
    task: str
    folder: Path  # screenshots + report.json go here
    browser: Browser
    human: Human
    log: Callable[[str, str], None]  # log(kind, text), e.g. log("think", "...")
    memory: dict = field(default_factory=dict)  # facts the agent remembered
    steps: list = field(default_factory=list)  # every action it took
    finish: dict | None = None  # set when the agent calls finish()
