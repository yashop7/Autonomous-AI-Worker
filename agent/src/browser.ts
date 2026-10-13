import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { config } from "./config";

// The agent's eyes and hands.
//
// Instead of sending screenshots to the LLM, we turn the page into a compact
// text "snapshot": every visible interactive element gets a numeric id, plus the
// readable page text and any alerts. The LLM answers with actions like
// click(7). This is cheaper, faster and more precise than pixel clicking.

export type ElementInfo = {
  id: number;
  role: string;
  name: string;
  value?: string;
  options?: string[];
  invalid?: boolean;
  error?: string;
  disabled?: boolean;
  submit?: boolean;
};

export type Snapshot = {
  url: string;
  dialog: string | null;
  alerts: string[];
  elements: ElementInfo[];
  text: string;
};

export class BrowserSession {
  private browser!: Browser;
  private context!: BrowserContext;
  page!: Page;

  async start() {
    this.browser = await chromium.launch({ headless: config.headless, slowMo: config.headless ? 0 : 120 });
    this.context = await this.browser.newContext({ viewport: { width: 1440, height: 900 } });
    this.page = await this.context.newPage();
  }

  async close() {
    await this.browser?.close();
  }

  // Only paths inside the workspace are allowed. This is a hard guardrail in
  // code, not an instruction we hope the model follows.
  async open(path: string) {
    const url = new URL(path, config.workspaceUrl + "/");
    if (url.origin !== new URL(config.workspaceUrl).origin) {
      throw new Error(`Blocked: ${url.origin} is outside the allowed workspace (${config.workspaceUrl})`);
    }
    await this.page.goto(url.toString());
    await this.settle();
  }

  // Wait until the page has finished loading data: network quiet and no
  // skeleton loaders (aria-busy) left on screen.
  async settle() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    await this.page
      .waitForFunction(() => !document.querySelector('[aria-busy="true"]'), undefined, { timeout: 8000 })
      .catch(() => {});
    await this.page.waitForTimeout(150);
  }

  async snapshot(): Promise<Snapshot> {
    // Runs inside the browser. Tags each interactive element with data-agent-id.
    return this.page.evaluate(() => {
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
      };
      const clean = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();

      // A modal dialog blocks everything behind it, so only its contents count
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      const root: ParentNode = dialog ?? document;

      document.querySelectorAll("[data-agent-id]").forEach((el) => el.removeAttribute("data-agent-id"));

      const selector = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="switch"], [role="tab"]';
      const elements: ElementInfo[] = [];
      let next = 1;

      for (const el of root.querySelectorAll(selector)) {
        if (!visible(el) || el.closest("[inert]")) continue;
        const id = next++;
        el.setAttribute("data-agent-id", String(id));

        const tag = el.tagName.toLowerCase();
        const input = el as HTMLInputElement;
        const labels = "labels" in el ? Array.from((el as HTMLInputElement).labels ?? []) : [];
        const name =
          clean(el.getAttribute("aria-label")) ||
          clean(labels.map((l) => l.textContent).join(" ")) ||
          clean(el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby")!)?.textContent) ||
          clean((el as HTMLElement).innerText) ||
          clean(el.getAttribute("placeholder")) ||
          clean(el.getAttribute("title"));

        const role =
          el.getAttribute("role") ??
          (tag === "a" ? "link" : tag === "select" ? "select" : tag === "textarea" ? "textbox" : tag === "input" ? "textbox" : "button");

        const info: ElementInfo = { id, role, name: name.slice(0, 120) };
        if (tag === "input" || tag === "textarea") info.value = input.value;
        if (tag === "select") {
          const sel = el as HTMLSelectElement;
          info.value = sel.selectedOptions[0]?.textContent?.trim() ?? "";
          info.options = Array.from(sel.options).filter((o) => !o.disabled).map((o) => clean(o.textContent)).slice(0, 20);
        }
        if (el.getAttribute("aria-checked")) info.value = el.getAttribute("aria-checked") === "true" ? "on" : "off";
        if (el.getAttribute("aria-pressed") === "true") info.value = "selected";
        if (el.getAttribute("aria-invalid") === "true") {
          info.invalid = true;
          const errId = el.getAttribute("aria-describedby");
          info.error = clean(errId ? document.getElementById(errId)?.textContent : "");
        }
        if ((el as HTMLButtonElement).disabled) info.disabled = true;
        if (tag === "button" && (el as HTMLButtonElement).type === "submit") info.submit = true;
        elements.push(info);
      }

      const alerts = Array.from(root.querySelectorAll('[role="alert"], [role="status"]'))
        .filter(visible)
        .map((a) => clean(a.textContent))
        .filter(Boolean);

      const textRoot = (dialog ?? document.querySelector("main") ?? document.body) as HTMLElement;
      return {
        url: location.pathname + location.search,
        dialog: dialog ? clean(dialog.querySelector("h1,h2,h3")?.textContent) || "Untitled dialog" : null,
        alerts,
        elements,
        text: clean(textRoot.innerText).slice(0, 5000),
      };
    });
  }

  locator(id: number) {
    return this.page.locator(`[data-agent-id="${id}"]`);
  }

  // Values currently typed into the form that contains this element. Used by
  // the approval gate so a human sees exactly what is about to be submitted.
  async formValues(id: number): Promise<Record<string, string>> {
    return this.locator(id).evaluate((btn) => {
      const form = btn.closest("form");
      if (!form) return {};
      const out: Record<string, string> = {};
      for (const el of form.querySelectorAll("input, select, textarea")) {
        const field = el as HTMLInputElement | HTMLSelectElement;
        const label = (field as HTMLInputElement).labels?.[0]?.textContent?.trim() || field.name;
        const value = field instanceof HTMLSelectElement ? field.selectedOptions[0]?.textContent?.trim() ?? "" : field.value;
        if (label) out[label] = value;
      }
      return out;
    });
  }

  async screenshot(path: string) {
    await this.page.screenshot({ path, fullPage: false });
    return path;
  }
}

// Text form of a snapshot, the exact thing the LLM "sees"
export function renderSnapshot(s: Snapshot): string {
  const lines: string[] = [`URL: ${s.url}`];
  if (s.dialog) lines.push(`⚠ A modal dialog "${s.dialog}" is open and blocks the page behind it. Only its controls are listed.`);
  if (s.alerts.length) lines.push(`ALERTS:\n${s.alerts.map((a) => `- ${a}`).join("\n")}`);
  lines.push("INTERACTIVE ELEMENTS:");
  for (const e of s.elements) {
    let line = `[${e.id}] ${e.role} "${e.name}"`;
    if (e.value !== undefined) line += ` value="${e.value}"`;
    if (e.options) line += ` options=${JSON.stringify(e.options)}`;
    if (e.submit) line += " (submits form)";
    if (e.disabled) line += " (disabled)";
    if (e.invalid) line += ` INVALID: ${e.error || "field has an error"}`;
    lines.push(line);
  }
  lines.push(`PAGE TEXT:\n${s.text}`);
  return lines.join("\n");
}
