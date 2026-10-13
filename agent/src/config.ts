// Central configuration. Everything tunable lives here so the rest of the
// code never reads process.env directly.
export const config = {
  openaiKey: process.env.OPENAI_API_KEY ?? "",
  model: process.env.OPENAI_MODEL ?? "gpt-4.1",
  // The only site the agent may open. Anything else is refused by the browser tool.
  workspaceUrl: (process.env.WORKSPACE_URL ?? "http://localhost:5173").replace(/\/$/, ""),
  headless: process.env.HEADLESS === "1",
  maxSteps: Number(process.env.MAX_STEPS ?? 30),
  // How many recent page snapshots stay in full in the LLM context
  keepSnapshots: 2,
  runsDir: new URL("../runs/", import.meta.url).pathname,
  playbooksFile: new URL("../data/playbooks.json", import.meta.url).pathname,
};

export function assertConfig() {
  if (!config.openaiKey) {
    throw new Error("OPENAI_API_KEY is missing. Add it to agent/.env (see .env.example).");
  }
}
