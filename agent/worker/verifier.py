"""
The verifier is a second agent with READ-ONLY tools (open_page, read_page).
It never sees the worker's reasoning, only its claim, and checks the real
systems itself. Like a manager checking work instead of trusting "done".
"""

import json
from urllib.parse import urlparse

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool

from .agent import agent_loop
from .prompts import VERIFIER_PROMPT
from .run import Run
from .tools import make_tools


def verify(run: Run) -> dict:
    verdict = {"verified": False, "evidence": "The verifier did not finish its check.", "submitted": False}

    @tool
    def submit_verdict(verified: bool, evidence: str) -> str:
        """Say whether the task was really done, with the evidence you saw."""
        verdict["verified"] = verified
        verdict["evidence"] = evidence
        verdict["submitted"] = True
        return "Verdict saved"

    all_tools = make_tools(run)
    tools = {"open_page": all_tools["open_page"], "read_page": all_tools["read_page"], "submit_verdict": submit_verdict}

    visited = sorted({urlparse(step["url"]).path for step in run.steps})
    question = f"""Task: {run.task}
Worker's claim: {run.finish['summary']}
Worker's evidence: {'; '.join(run.finish['evidence'])}
Facts the worker remembered: {json.dumps(run.memory)}
Pages the worker visited: {', '.join(visited)}

Open the source document and the record that was created, compare them, then call submit_verdict."""

    agent_loop(run, lambda: VERIFIER_PROMPT, [HumanMessage(question)], tools, 10, lambda: verdict["submitted"])
    run.browser.screenshot(run.folder / "verified.png")
    return verdict
