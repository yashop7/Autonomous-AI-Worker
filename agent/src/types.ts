import type { BrowserSession } from "./browser";

// Everything the agent reports while working. The CLI prints these; the
// dashboard streams them. One event stream, many front-ends.
export type AgentEvent =
  | { type: "run-started"; runId: string; task: string; playbooks: string[] }
  | { type: "thinking"; step: number; text: string }
  | { type: "action"; step: number; tool: string; args: Record<string, unknown> }
  | { type: "observation"; step: number; tool: string; ok: boolean; summary: string; screenshot?: string }
  | { type: "approval-requested"; step: number; request: ApprovalRequest }
  | { type: "approval-resolved"; step: number; approved: boolean; note?: string }
  | { type: "question"; step: number; question: string; options?: string[] }
  | { type: "answer"; step: number; answer: string }
  | { type: "memory"; key: string; value: string }
  | { type: "warning"; step: number; text: string }
  | { type: "verifying" }
  | { type: "verified"; result: Verdict }
  | { type: "playbook-saved"; title: string }
  | { type: "run-finished"; report: RunReport };

export type ApprovalRequest = {
  action: string; // e.g. Click "Save payable"
  reason: string; // why the agent wants to do it
  details: Record<string, string>; // form values about to be submitted
};

// The human in the loop. Implemented by the CLI (terminal prompts),
// the dashboard (buttons) and evals (auto-approve).
export interface Human {
  approve(request: ApprovalRequest): Promise<{ approved: boolean; note?: string }>;
  ask(question: string, options?: string[]): Promise<string>;
}

export type FinishStatus = "done" | "blocked" | "needs_user";

export type Finish = { status: FinishStatus; summary: string; evidence: string[] };

export type Verdict = { verified: boolean; evidence: string; issues: string[]; screenshot?: string };

export type TraceEntry = {
  step: number;
  tool: string;
  args: Record<string, unknown>;
  ok: boolean;
  summary: string;
  at: string;
  screenshot?: string;
};

export type RunReport = {
  runId: string;
  task: string;
  status: FinishStatus | "step_limit" | "error";
  summary: string;
  evidence: string[];
  verdict: Verdict | null;
  memory: Record<string, string>;
  steps: number;
  durationMs: number;
  trace: TraceEntry[];
  runDir: string;
};

// Shared state for one run, handed to every tool
export type RunContext = {
  runId: string;
  runDir: string;
  browser: BrowserSession;
  human: Human;
  memory: Map<string, string>;
  trace: TraceEntry[];
  step: number;
  finish: Finish | null;
  emit: (event: AgentEvent) => void;
};
