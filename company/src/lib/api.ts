import useSWR from "swr";
import type { Activity, Email, Invoice, Payable, Settings, Vendor } from "./types";

export class ApiError extends Error {
  status: number;
  fields: Record<string, string>;
  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`, body.fields);
  return body as T;
}

const fetcher = <T,>(path: string) => api<T>(path);

// SWR dedupes requests across components and revalidates on focus,
// so a change made by the agent in another tab shows up here.
export const useEmails = () => useSWR<Email[]>("/mail", fetcher);
// Fetching a message marks it read server-side; onSuccess lets the inbox refresh its unread dots
export const useEmail = (id: string | undefined, onSuccess?: () => void) =>
  useSWR<Email>(id ? `/mail/${id}` : null, fetcher, { onSuccess });
export const useInvoices = (query: string) => useSWR<Invoice[]>(`/portal/invoices${query}`, fetcher);
export const useInvoice = (id: string | undefined) => useSWR<Invoice>(id ? `/portal/invoices/${id}` : null, fetcher);
export const useVendors = () => useSWR<Vendor[]>("/ledger/vendors", fetcher);
export const useVendor = (id: string | undefined) => useSWR<Vendor>(id ? `/ledger/vendors/${id}` : null, fetcher);
export const usePayables = () => useSWR<Payable[]>("/ledger/payables", fetcher);
export const useActivity = () => useSWR<Activity[]>("/ledger/activity", fetcher);
export const useSettings = () => useSWR<Settings>("/settings", fetcher);
