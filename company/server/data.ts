// Seed data for the simulated company "Acme Corp".
// Everything is fictional. The store is in memory and can be reset to this seed
// at any time, which keeps agent runs and evals deterministic.

export type Vendor = {
  id: string;
  name: string;
  email: string;
  gstin: string;
  address: string;
  paymentTermsDays: number;
};

export type LineItem = { description: string; quantity: number; unitPrice: number };

export type Invoice = {
  id: string;
  number: string;
  vendorId: string;
  issueDate: string; // ISO yyyy-mm-dd
  dueDate: string; // ISO yyyy-mm-dd
  poNumber: string;
  lineItems: LineItem[];
  taxRate: number;
  paid: boolean;
};

export type Email = {
  id: string;
  from: { name: string; email: string };
  subject: string;
  body: string;
  receivedAt: string; // ISO datetime
  read: boolean;
};

export const CATEGORIES = [
  "Raw materials",
  "Software",
  "Logistics",
  "Facilities",
  "Professional services",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Payable = {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  amount: number;
  invoiceDate: string; // ISO yyyy-mm-dd
  dueDate: string; // ISO yyyy-mm-dd
  category: Category;
  notes: string;
  createdAt: string;
};

export type Activity = { id: string; at: string; action: string; detail: string };

export type Settings = {
  cookieBanner: boolean; // Vendorly shows a consent dialog that blocks the page
  strictDates: boolean; // Ledger only accepts DD/MM/YYYY dates
  flakySubmit: boolean; // First save of each payable fails with a 503
  slowNetwork: boolean; // Adds 300–1200 ms latency to every API call
};

const vendors: Vendor[] = [
  {
    id: "v_globex",
    name: "Globex Industries Pvt Ltd",
    email: "billing@globex.example",
    gstin: "27AAACG1234F1Z5",
    address: "Plot 14, MIDC Bhosari, Pune, Maharashtra 411026",
    paymentTermsDays: 30,
  },
  {
    id: "v_initech",
    name: "Initech Software Services",
    email: "accounts@initech.example",
    gstin: "29AABCI5678K1Z2",
    address: "2nd Floor, Embassy Golf Links, Domlur, Bengaluru, Karnataka 560071",
    paymentTermsDays: 30,
  },
  {
    id: "v_northwind",
    name: "Northwind Traders",
    email: "ar@northwind.example",
    gstin: "27AADCN9012M1Z8",
    address: "Unit 7, Andheri Industrial Estate, Mumbai, Maharashtra 400053",
    paymentTermsDays: 30,
  },
  {
    id: "v_umbrella",
    name: "Umbrella Facility Services",
    email: "finance@umbrella.example",
    gstin: "06AAECU3456P1Z1",
    address: "Tower B, DLF Cyber City, Gurugram, Haryana 122002",
    paymentTermsDays: 15,
  },
  {
    id: "v_stark",
    name: "Stark Logistics",
    email: "invoices@starklogistics.example",
    gstin: "33AAFCS7890Q1Z4",
    address: "Ambattur Industrial Estate, Chennai, Tamil Nadu 600058",
    paymentTermsDays: 15,
  },
];

const invoices: Invoice[] = [
  {
    id: "inv_glx_0412",
    number: "GLX-2026-0412",
    vendorId: "v_globex",
    issueDate: "2026-08-28",
    dueDate: "2026-09-27",
    poNumber: "PO-88104",
    lineItems: [
      { description: "Cold-rolled steel sheet, 1.2 mm", quantity: 120, unitPrice: 310 },
      { description: "Freight and handling", quantity: 1, unitPrice: 2400 },
    ],
    taxRate: 0.18,
    paid: true,
  },
  {
    id: "inv_glx_0457",
    number: "GLX-2026-0457",
    vendorId: "v_globex",
    issueDate: "2026-09-26",
    dueDate: "2026-10-26",
    poNumber: "PO-88152",
    lineItems: [
      { description: "Aluminium extrusion, 6063-T5", quantity: 80, unitPrice: 265 },
      { description: "Freight and handling", quantity: 1, unitPrice: 1800 },
    ],
    taxRate: 0.18,
    paid: false,
  },
  {
    id: "inv_glx_0481",
    number: "GLX-2026-0481",
    vendorId: "v_globex",
    issueDate: "2026-10-09",
    dueDate: "2026-11-08",
    poNumber: "PO-88197",
    lineItems: [
      { description: "Cold-rolled steel sheet, 1.2 mm", quantity: 100, unitPrice: 315 },
      { description: "Stainless fasteners, M8 (box of 500)", quantity: 12, unitPrice: 650 },
      { description: "Freight and handling", quantity: 1, unitPrice: 1200 },
    ],
    taxRate: 0.18,
    paid: false,
  },
  {
    id: "inv_ini_7781",
    number: "INI-7781",
    vendorId: "v_initech",
    issueDate: "2026-09-15",
    dueDate: "2026-10-15",
    poNumber: "PO-88140",
    lineItems: [{ description: "TPS reporting suite, annual licence (25 seats)", quantity: 25, unitPrice: 1800 }],
    taxRate: 0.18,
    paid: false,
  },
  {
    id: "inv_ini_7802",
    number: "INI-7802",
    vendorId: "v_initech",
    issueDate: "2026-10-01",
    dueDate: "2026-10-31",
    poNumber: "PO-88171",
    lineItems: [{ description: "Implementation support, September", quantity: 16, unitPrice: 2200 }],
    taxRate: 0.18,
    paid: false,
  },
  {
    id: "inv_nw_3310",
    number: "NW-3310",
    vendorId: "v_northwind",
    issueDate: "2026-10-05",
    dueDate: "2026-11-04",
    poNumber: "PO-88180",
    lineItems: [{ description: "Packaging cartons, 5-ply", quantity: 400, unitPrice: 32 }],
    taxRate: 0.18,
    paid: false,
  },
  {
    id: "inv_nw_3311",
    number: "NW-3311",
    vendorId: "v_northwind",
    issueDate: "2026-10-05",
    dueDate: "2026-11-04",
    poNumber: "PO-88181",
    lineItems: [{ description: "Stretch wrap film, 500 mm", quantity: 60, unitPrice: 145 }],
    taxRate: 0.18,
    paid: false,
  },
  {
    id: "inv_umb_0921",
    number: "UMB-0921",
    vendorId: "v_umbrella",
    issueDate: "2026-09-01",
    dueDate: "2026-09-16",
    poNumber: "PO-88120",
    lineItems: [{ description: "Housekeeping services, August", quantity: 1, unitPrice: 42000 }],
    taxRate: 0.18,
    paid: false,
  },
  {
    id: "inv_umb_0954",
    number: "UMB-0954",
    vendorId: "v_umbrella",
    issueDate: "2026-09-20",
    dueDate: "2026-10-05",
    poNumber: "PO-88158",
    lineItems: [
      { description: "Housekeeping services, September", quantity: 1, unitPrice: 42000 },
      { description: "Deep cleaning, warehouse B", quantity: 1, unitPrice: 9500 },
    ],
    taxRate: 0.18,
    paid: false,
  },
  {
    id: "inv_stk_55120",
    number: "STK-55120",
    vendorId: "v_stark",
    issueDate: "2026-10-02",
    dueDate: "2026-10-17",
    poNumber: "PO-88175",
    lineItems: [{ description: "Full truckload, Pune to Chennai", quantity: 2, unitPrice: 38500 }],
    taxRate: 0.18,
    paid: false,
  },
];

const emails: Email[] = [
  {
    id: "mail_priya_globex",
    from: { name: "Priya Sharma", email: "priya.sharma@acme.example" },
    subject: "Record the new Globex invoice",
    body:
      "Hi,\n\nGlobex sent their latest invoice this week. Can you find it on Vendorly and record it in Ledger as a payable under Raw materials?\n\nLet me know once it's in.\n\nThanks,\nPriya\nFinance Manager, Acme Corp",
    receivedAt: "2026-10-13T09:12:00+05:30",
    read: false,
  },
  {
    id: "mail_initech_address",
    from: { name: "Initech Accounts", email: "accounts@initech.example" },
    subject: "Updated billing address",
    body:
      "Dear Acme team,\n\nPlease note that Initech Software Services has moved. Kindly update our billing address in your records to:\n\n4th Floor, Prestige Tech Park, Outer Ring Road, Marathahalli, Bengaluru, Karnataka 560103\n\nOur GSTIN and bank details are unchanged.\n\nRegards,\nAccounts Team\nInitech Software Services",
    receivedAt: "2026-10-12T16:40:00+05:30",
    read: false,
  },
  {
    id: "mail_rahul_overdue",
    from: { name: "Rahul Mehta", email: "rahul.mehta@acme.example" },
    subject: "Which vendor invoices are overdue?",
    body:
      "Hey,\n\nBefore Thursday's cash review, could you send me a list of vendor invoices that are past their due date and still unpaid, with amounts?\n\nCheers,\nRahul",
    receivedAt: "2026-10-12T11:05:00+05:30",
    read: true,
  },
  {
    id: "mail_vendorly_northwind",
    from: { name: "Vendorly", email: "no-reply@vendorly.example" },
    subject: "Northwind Traders shared 2 new invoices",
    body:
      "Northwind Traders shared 2 new invoices with Acme Corp on Vendorly.\n\nSign in to Vendorly to review them.",
    receivedAt: "2026-10-05T14:22:00+05:30",
    read: true,
  },
  {
    id: "mail_allhands",
    from: { name: "People Team", email: "people@acme.example" },
    subject: "All-hands moved to Friday 4 pm",
    body: "Hi all,\n\nThis month's all-hands is moving to Friday at 4 pm in the main conference room. Snacks on us.\n\nPeople Team",
    receivedAt: "2026-10-10T10:00:00+05:30",
    read: true,
  },
];

const payables: Payable[] = [
  {
    id: "pay_0001",
    vendorId: "v_globex",
    invoiceNumber: "GLX-2026-0412",
    amount: 46728,
    invoiceDate: "2026-08-28",
    dueDate: "2026-09-27",
    category: "Raw materials",
    notes: "Paid 24/09 via NEFT",
    createdAt: "2026-08-30T10:15:00+05:30",
  },
  {
    id: "pay_0002",
    vendorId: "v_umbrella",
    invoiceNumber: "UMB-0921",
    amount: 49560,
    invoiceDate: "2026-09-01",
    dueDate: "2026-09-16",
    category: "Facilities",
    notes: "",
    createdAt: "2026-09-03T12:02:00+05:30",
  },
  {
    id: "pay_0003",
    vendorId: "v_initech",
    invoiceNumber: "INI-7802",
    amount: 41536,
    invoiceDate: "2026-10-01",
    dueDate: "2026-10-31",
    category: "Software",
    notes: "",
    createdAt: "2026-10-02T09:40:00+05:30",
  },
];

const defaultSettings: Settings = {
  cookieBanner: true,
  strictDates: true,
  flakySubmit: true,
  slowNetwork: false,
};

export function createSeed() {
  // structuredClone so a reset never shares references with mutated state
  return structuredClone({
    vendors,
    invoices,
    emails,
    payables,
    activity: [] as Activity[],
    settings: defaultSettings,
  });
}
