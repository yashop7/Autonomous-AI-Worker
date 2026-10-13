import type { InvoiceStatus } from "@/lib/types";
import { daysUntil } from "@/lib/format";
import { cn } from "@/lib/cn";

const styles: Record<InvoiceStatus | "soon", string> = {
  paid: "bg-ok-soft text-ok",
  overdue: "bg-danger-soft text-danger",
  soon: "bg-warn-soft text-warn",
  unpaid: "bg-subtle text-ink-2",
};

export function StatusBadge({ status, dueDate }: { status: InvoiceStatus; dueDate: string }) {
  const days = daysUntil(dueDate);
  const tone = status === "unpaid" && days <= 7 ? "soon" : status;
  const label =
    status === "paid"
      ? "Paid"
      : status === "overdue"
        ? `Overdue ${-days}d`
        : days === 0
          ? "Due today"
          : `Due in ${days}d`;
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[12px] font-medium whitespace-nowrap", styles[tone])}>
      {label}
    </span>
  );
}
