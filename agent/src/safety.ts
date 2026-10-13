import type { ElementInfo } from "./browser";

// Actions that change data in a company system need a human's OK first.
// The policy lives in code, so the model cannot talk its way around it.
const RISKY_WORDS = /\b(save|submit|pay|delete|remove|approve|confirm|send|record|update|reset|transfer)\b/i;

export function needsApproval(el: ElementInfo): boolean {
  if (el.role === "link") return false;
  return Boolean(el.submit) || RISKY_WORDS.test(el.name);
}
