"""
THE AGENT LOOP

    while not finished:
        1. THINK    send the goal + history + current page to the LLM
        2. ACT      the LLM picks tools (click, type, ...) and we run them
        3. OBSERVE  each tool returns what happened + the new page

That's the whole agent. The LLM decides every step; this code just runs it.
"""

import json
import re
import time

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI

from . import config
from .browser import Browser
from .playbooks import learn_playbook, load_playbooks, playbooks_text
from .prompts import SYSTEM_PROMPT
from .run import Human, Run
from .tools import make_tools


def chat_model():
    return ChatOpenAI(model=config.MODEL, api_key=config.OPENAI_API_KEY, temperature=0)


def agent_loop(run: Run, system_prompt, messages: list, tools: dict, max_steps: int, is_done):
    """Think → act → observe, until is_done() is true or we run out of steps.

    system_prompt is a function, so it can include the latest memory every step.
    """
    llm = chat_model().bind_tools(list(tools.values()))
    last_actions = []

    for step in range(max_steps):
        shrink_old_pages(messages)

        # 1. THINK
        reply = llm.invoke([SystemMessage(system_prompt())] + messages)
        messages.append(reply)
        if reply.content:
            run.log("think", reply.content)

        # The LLM answered with text but no action: remind it to use tools
        if not reply.tool_calls:
            messages.append(HumanMessage("Continue using the tools. Call finish when you're done."))
            continue

        # 2. ACT  +  3. OBSERVE
        for call in reply.tool_calls:
            run.log("action", f"{call['name']} {json.dumps(call['args'])}")
            output = str(tools[call["name"]].invoke(call["args"]))

            # Stuck detection: same action 3 times in a row → tell the LLM to change approach
            action = call["name"] + json.dumps(call["args"], sort_keys=True)
            last_actions.append(action)
            if last_actions[-3:] == [action] * 3:
                output = "WARNING: you did the exact same action 3 times. Try something different or ask_user.\n\n" + output
                run.log("warn", "Agent is repeating itself, nudging it")

            first_line = output.split("\n")[0]
            run.log("result", first_line)
            run.steps.append({"tool": call["name"], "args": call["args"], "result": first_line, "url": run.browser.page.url})
            messages.append(ToolMessage(content=output, tool_call_id=call["id"]))

            if is_done():
                return


def shrink_old_pages(messages: list):
    """Page snapshots are big. Keep the last few in full.
    For older ones the refs (e12...) are useless now, so cut them out and keep
    a short text version: enough to remember what was read (email text, amounts)."""
    tool_messages = [m for m in messages if isinstance(m, ToolMessage)]
    for message in tool_messages[: -config.KEEP_PAGES]:
        if not message.content.startswith("[old page]"):
            short = re.sub(r" \[ref=\w+\]| \[cursor=pointer\]", "", message.content)[:2000]
            message.content = "[old page] " + short


def run_task(task: str, human: Human, log) -> dict:
    """Run one task: open browser → agent loop → verify → learn → save report."""
    from .verifier import verify  # imported here to avoid a circular import

    folder = config.RUNS_DIR / str(int(time.time()))
    folder.mkdir(parents=True, exist_ok=True)

    browser = Browser()
    browser.start()
    run = Run(task=task, folder=folder, browser=browser, human=human, log=log)

    try:
        # Playbooks = lessons learned from earlier successful tasks
        playbooks = load_playbooks()
        if playbooks:
            log("think", "Known playbooks: " + ", ".join(p["title"] for p in playbooks))

        def system_prompt():
            memory = json.dumps(run.memory, indent=2)
            return SYSTEM_PROMPT + playbooks_text(playbooks) + f"\n\nFacts you remembered:\n{memory}"

        browser.open("/mail")
        messages = [HumanMessage(f"Task: {task}\n\nYou are looking at:\n{browser.read()}")]

        agent_loop(run, system_prompt, messages, make_tools(run), config.MAX_STEPS, lambda: run.finish is not None)
        browser.screenshot(folder / "final.png")

        finish = run.finish or {"status": "blocked", "summary": "Ran out of steps before finishing.", "evidence": []}

        # Don't trust "done": an independent checker looks at the real systems
        worker_steps = list(run.steps)  # copy now; the verifier's steps get added after this
        verified = False
        if finish["status"] == "done":
            log("verify", "Checking the result independently...")
            verdict = verify(run)
            verified = verdict["verified"]
            log("verify", f"{'VERIFIED' if verified else 'NOT VERIFIED'}: {verdict['evidence']}")

            # Only verified successes become playbooks, so the agent never learns a mistake
            if verified:
                playbook = learn_playbook(task, worker_steps)
                log("memory", f"Learned playbook: {playbook['title']}")

        report = {"task": task, **finish, "verified": verified, "memory": run.memory, "steps": worker_steps}
        (folder / "report.json").write_text(json.dumps(report, indent=2))
        log("done", f"{finish['status'].upper()}{' (verified)' if verified else ''}: {finish['summary']}")
        return report
    finally:
        browser.close()
