// Mirrors the API shapes returned by server/index.ts
export type Vendor = {
  id: string;
  name: string;
  email: string;
  gstin: string;
  address: string;
  paymentTermsDays: number;
};

export type LineItem = { description: string; quantity: number; unitPrice: number };

export type InvoiceStatus = "paid" | "overdue" | "unpaid";

export type Invoice = {
  id: string;
  number: string;
  vendorId: string;
  vendor: Vendor;
  issueDate: string;
  dueDate: string;
  poNumber: string;
  lineItems: LineItem[];
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
};

export type Email = {
  id: string;
  from: { name: string; email: string };
  subject: string;
  body: string;
  receivedAt: string;
  read: boolean;
};

export type Payable = {
  id: string;
  vendorId: string;
  vendor: Vendor;
  invoiceNumber: string;
  amount: number;
  invoiceDate: string;
  dueDate: string;
  category: string;
  notes: string;
  createdAt: string;
};

export type Activity = { id: string; at: string; action: string; detail: string };

export type Settings = {
  cookieBanner: boolean;
  strictDates: boolean;
  flakySubmit: boolean;
  slowNetwork: boolean;
};

export const CATEGORIES = [
  "Raw materials",
  "Software",
  "Logistics",
  "Facilities",
  "Professional services",
  "Other",
] as const;
