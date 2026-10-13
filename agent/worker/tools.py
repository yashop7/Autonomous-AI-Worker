"""
The tools are the agent's only way to touch the world.

They are generic: nothing here knows about invoices, Globex or Ledger.
The LLM decides which tool to use and when. That's what makes it an agent.

Every browser tool returns: what happened + what the page looks like now.
Errors are returned as text (not raised) so the LLM can read them and adapt.
"""

import re
from typing import Literal

from langchain_core.tools import tool

from .run import Run

# Buttons with these words change company data, so a human must approve first.
# This check is in code, so the LLM can't skip it.
RISKY = re.compile(r"save|submit|pay|delete|remove|approve|confirm|send|update|reset", re.IGNORECASE)


def make_tools(run: Run):
    browser = run.browser

    def result(message: str) -> str:
        return f"{message}\n\n{browser.read()}"

    @tool
    def open_page(path: str) -> str:
        """Open a page in the company workspace, for example /mail or /ledger/payables."""
        try:
            browser.open(path)
            return result(f"Opened {path}")
        except Exception as error:
            return result(f"ERROR: {error}")

    @tool
    def read_page() -> str:
        """Look at the current page again without doing anything."""
        return result("Current page:")

    @tool
    def click(ref: str, reason: str) -> str:
        """Click a link or button by its ref (like e12). Give a one-sentence reason.
        Save/submit buttons wait for human approval."""
        try:
            # Read the button text from the page itself, not from the LLM,
            # so the LLM can't skip approval by describing the button differently
            label = browser.element(ref).inner_text(timeout=5000).strip()[:80]

            # Safety gate: ask the human before any risky click
            if RISKY.search(label):
                if not run.human.approve(f'Click "{label}"', reason):
                    return result(f'NOT DONE: the user rejected "{label}". Don\'t try it again.')

            browser.element(ref).click(timeout=5000)
            return result(f'Clicked "{label}"')
        except Exception as error:
            return result(f"ERROR: could not click {ref}: {first_line(error)}")

    @tool
    def type_text(ref: str, text: str) -> str:
        """Replace the text in a text box."""
        try:
            browser.element(ref).fill(text, timeout=5000)
            return result(f'Typed "{text}"')
        except Exception as error:
            return result(f"ERROR: could not type into {ref}: {first_line(error)}")

    @tool
    def select_option(ref: str, option: str) -> str:
        """Choose an option in a dropdown (combobox) by its exact text."""
        try:
            browser.element(ref).select_option(label=option, timeout=5000)
            return result(f'Selected "{option}"')
        except Exception as error:
            return result(f'ERROR: could not select "{option}": {first_line(error)}')

    @tool
    def remember(key: str, value: str) -> str:
        """Save a fact you will need later (amount, date, invoice number, instruction from an email)."""
        run.memory[key] = value
        run.log("memory", f"{key} = {value}")
        return f"Remembered {key}"

    @tool
    def ask_user(question: str) -> str:
        """Ask the user when something is unclear (e.g. two equally good matches). Never guess."""
        return f"The user answered: {run.human.ask(question)}"

    @tool
    def finish(status: Literal["done", "blocked", "needs_user"], summary: str, evidence: list[str]) -> str:
        """Stop working. Use 'done' only after you SAW the result on screen.
        Use 'blocked' if you can't do it, 'needs_user' if you need the user.
        summary: short message for the user.
        evidence: what you saw on screen that proves it, e.g. 'Recorded ... as pay_0100'."""
        run.finish = {"status": status, "summary": summary, "evidence": evidence}
        return "Finished"

    return {
        "open_page": open_page,
        "read_page": read_page,
        "click": click,
        "type_text": type_text,
        "select_option": select_option,
        "remember": remember,
        "ask_user": ask_user,
        "finish": finish,
    }


def first_line(error: Exception) -> str:
    return str(error).split("\n")[0]
