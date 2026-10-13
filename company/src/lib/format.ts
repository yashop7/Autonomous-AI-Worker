const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const shortTime = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const shortDay = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export const formatINR = (n: number) => inr.format(n);

// ISO yyyy-mm-dd → "9 Oct 2026"
export const formatDate = (iso: string) => longDate.format(new Date(`${iso}T00:00:00Z`));

// ISO yyyy-mm-dd → "09/10/2026", the format Ledger expects
export const toDMY = (iso: string) => iso.split("-").reverse().join("/");

export function formatReceived(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? shortTime.format(d) : shortDay.format(d);
}

export function daysUntil(iso: string) {
  const today = new Date(new Date().toISOString().slice(0, 10));
  return Math.round((new Date(iso).getTime() - today.getTime()) / 86_400_000);
}
