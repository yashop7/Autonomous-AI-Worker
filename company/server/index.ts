import { Hono } from "hono";
import { logger } from "hono/logger";
import { z } from "zod";
import { CATEGORIES, createSeed, type Invoice, type Payable } from "./data";

// In-memory store. POST /api/reset restores the seed so every agent run starts clean.
let db = createSeed();
// Invoice numbers whose first save already failed once (flakySubmit chaos)
let failedOnce = new Set<string>();
let nextPayableId = 100;

const app = new Hono().basePath("/api");
app.use(logger());

// slowNetwork chaos: random latency on every call
app.use(async (_c, next) => {
  if (db.settings.slowNetwork) await Bun.sleep(300 + Math.random() * 900);
  await next();
});

function log(action: string, detail: string) {
  db.activity.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), action, detail });
}

function invoiceTotals(inv: Invoice) {
  const subtotal = inv.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const tax = Math.round(subtotal * inv.taxRate * 100) / 100;
  return { subtotal, tax, total: subtotal + tax };
}

function invoiceStatus(inv: Invoice): "paid" | "overdue" | "unpaid" {
  if (inv.paid) return "paid";
  const today = new Date().toISOString().slice(0, 10);
  return inv.dueDate < today ? "overdue" : "unpaid";
}

function serializeInvoice(inv: Invoice) {
  const vendor = db.vendors.find((v) => v.id === inv.vendorId)!;
  return { ...inv, ...invoiceTotals(inv), status: invoiceStatus(inv), vendor };
}

// ── Mail ────────────────────────────────────────────────────────────────────
app.get("/mail", (c) => c.json(db.emails.toSorted((a, b) => b.receivedAt.localeCompare(a.receivedAt))));

app.get("/mail/:id", (c) => {
  const email = db.emails.find((e) => e.id === c.req.param("id"));
  if (!email) return c.json({ error: "Email not found" }, 404);
  email.read = true;
  return c.json(email);
});

// ── Vendorly (vendor portal) ────────────────────────────────────────────────
app.get("/portal/invoices", (c) => {
  const vendorId = c.req.query("vendor");
  const status = c.req.query("status");
  const list = db.invoices
    .map(serializeInvoice)
    .filter((inv) => (!vendorId || inv.vendorId === vendorId) && (!status || inv.status === status))
    .toSorted((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number));
  return c.json(list);
});

app.get("/portal/invoices/:id", (c) => {
  const inv = db.invoices.find((i) => i.id === c.req.param("id"));
  if (!inv) return c.json({ error: "Invoice not found" }, 404);
  return c.json(serializeInvoice(inv));
});

// ── Ledger (internal ERP) ───────────────────────────────────────────────────
app.get("/ledger/vendors", (c) => c.json(db.vendors));

app.get("/ledger/vendors/:id", (c) => {
  const vendor = db.vendors.find((v) => v.id === c.req.param("id"));
  if (!vendor) return c.json({ error: "Vendor not found" }, 404);
  return c.json(vendor);
});

const vendorPatch = z.object({
  address: z.string().trim().min(10, "Enter the full address, including city and PIN code"),
  email: z.email("Enter a valid email address").optional(),
});

app.patch("/ledger/vendors/:id", async (c) => {
  const vendor = db.vendors.find((v) => v.id === c.req.param("id"));
  if (!vendor) return c.json({ error: "Vendor not found" }, 404);
  const parsed = vendorPatch.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Some fields need attention", fields: fieldErrors(parsed.error) }, 422);
  const before = vendor.address;
  Object.assign(vendor, parsed.data);
  log("vendor.updated", `${vendor.name}: address changed from "${before}" to "${vendor.address}"`);
  return c.json(vendor);
});

app.get("/ledger/payables", (c) => {
  const list = db.payables
    .map((p) => ({ ...p, vendor: db.vendors.find((v) => v.id === p.vendorId)! }))
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  return c.json(list);
});

const DMY = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

// Returns an ISO date, or null when the input is not an acceptable real date
function parseDate(input: string, strict: boolean): string | null {
  const dmy = DMY.exec(input.trim());
  const iso = strict ? null : ISO.exec(input.trim());
  const parts = dmy ? [dmy[3], dmy[2], dmy[1]] : iso ? [iso[1], iso[2], iso[3]] : null;
  if (!parts) return null;
  const isoDate = parts.join("-");
  const d = new Date(`${isoDate}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(isoDate) ? isoDate : null;
}

const payableInput = z.object({
  vendorId: z.string().min(1, "Choose a vendor"),
  invoiceNumber: z.string().trim().min(1, "Enter the invoice number"),
  amount: z.union([z.string(), z.number()]),
  invoiceDate: z.string().min(1, "Enter the invoice date"),
  dueDate: z.string().min(1, "Enter the due date"),
  category: z.enum(CATEGORIES, "Choose a category"),
  notes: z.string().optional().default(""),
});

function fieldErrors(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fields[key] ??= issue.message;
  }
  return fields;
}

app.post("/ledger/payables", async (c) => {
  const parsed = payableInput.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Some fields need attention", fields: fieldErrors(parsed.error) }, 422);
  const input = parsed.data;
  const strict = db.settings.strictDates;
  const fields: Record<string, string> = {};

  const vendor = db.vendors.find((v) => v.id === input.vendorId);
  if (!vendor) fields.vendorId = "Choose a vendor from the list";

  const amount = Number(String(input.amount).replace(/[₹,\s]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) fields.amount = "Enter the amount as a number, for example 47790.00";

  const dateHint = strict ? "Use the DD/MM/YYYY format, for example 08/11/2026" : "Use DD/MM/YYYY or YYYY-MM-DD";
  const invoiceDate = parseDate(input.invoiceDate, strict);
  const dueDate = parseDate(input.dueDate, strict);
  if (!invoiceDate) fields.invoiceDate = `Invoice date is not valid. ${dateHint}`;
  if (!dueDate) fields.dueDate = `Due date is not valid. ${dateHint}`;
  if (invoiceDate && dueDate && dueDate < invoiceDate) fields.dueDate = "Due date can't be before the invoice date";

  if (Object.keys(fields).length > 0) return c.json({ error: "Some fields need attention", fields }, 422);

  const duplicate = db.payables.find(
    (p) => p.vendorId === input.vendorId && p.invoiceNumber.toLowerCase() === input.invoiceNumber.toLowerCase(),
  );
  if (duplicate) {
    return c.json(
      { error: `Invoice ${input.invoiceNumber} is already recorded for ${vendor!.name} (${duplicate.id})`, existingId: duplicate.id },
      409,
    );
  }

  // flakySubmit chaos: the first save of each invoice fails with a transient error
  const key = `${input.vendorId}:${input.invoiceNumber.toLowerCase()}`;
  if (db.settings.flakySubmit && !failedOnce.has(key)) {
    failedOnce.add(key);
    return c.json({ error: "Ledger is temporarily unavailable. Your entry was not saved. Try again in a moment." }, 503);
  }

  const payable: Payable = {
    id: `pay_${String(nextPayableId++).padStart(4, "0")}`,
    vendorId: input.vendorId,
    invoiceNumber: input.invoiceNumber,
    amount: Math.round(amount * 100) / 100,
    invoiceDate: invoiceDate!,
    dueDate: dueDate!,
    category: input.category,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };
  db.payables.push(payable);
  log("payable.created", `${payable.id} · ${vendor!.name} · ${payable.invoiceNumber} · ₹${payable.amount}`);
  return c.json({ ...payable, vendor }, 201);
});

app.get("/ledger/activity", (c) => c.json(db.activity));

// ── Environment controls ────────────────────────────────────────────────────
app.get("/settings", (c) => c.json(db.settings));

const settingsPatch = z.object({
  cookieBanner: z.boolean(),
  strictDates: z.boolean(),
  flakySubmit: z.boolean(),
  slowNetwork: z.boolean(),
}).partial();

app.patch("/settings", async (c) => {
  const parsed = settingsPatch.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "Invalid settings" }, 400);
  Object.assign(db.settings, parsed.data);
  return c.json(db.settings);
});

app.post("/reset", (c) => {
  const keepSettings = c.req.query("keepSettings") === "1";
  const settings = db.settings;
  db = createSeed();
  if (keepSettings) db.settings = settings;
  failedOnce = new Set();
  nextPayableId = 100;
  return c.json({ ok: true, settings: db.settings });
});

app.get("/health", (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 8787);
console.log(`Acme Workspace API on http://localhost:${port}/api`);

export default { port, fetch: app.fetch };
