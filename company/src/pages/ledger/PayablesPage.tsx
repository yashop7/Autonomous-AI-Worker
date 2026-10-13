import { CheckCircle, Plus } from "@phosphor-icons/react";
import { Link, useSearchParams } from "react-router";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { usePayables } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate, formatINR } from "@/lib/format";

export default function PayablesPage() {
  const [params] = useSearchParams();
  const createdId = params.get("created");
  const { data: payables, error, isLoading, mutate } = usePayables();
  const created = createdId ? payables?.find((p) => p.id === createdId) : undefined;
  const outstanding = payables?.reduce((sum, p) => sum + p.amount, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title="Payables"
        description="Supplier invoices recorded in Ledger. Every entry here is queued for the next payment run."
        actions={
          <Link
            to="/ledger/payables/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-control bg-accent px-3 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-accent-hover active:scale-[0.98]"
          >
            <Plus size={14} weight="bold" aria-hidden /> New payable
          </Link>
        }
      />

      {created ? (
        <div role="status" className="mx-6 mt-5 flex items-center gap-2.5 rounded-panel border border-ok/20 bg-ok-soft px-4 py-3 text-[13px] text-ok md:mx-8">
          <CheckCircle size={18} weight="fill" aria-hidden />
          <p>
            Recorded <span className="font-mono font-medium">{created.invoiceNumber}</span> from {created.vendor.name} for{" "}
            <span className="tabular font-medium">{formatINR(created.amount)}</span> as {created.id}.
          </p>
        </div>
      ) : null}

      {payables && payables.length > 0 ? (
        <dl className="grid grid-cols-2 gap-px border-b border-line bg-line md:grid-cols-3">
          <Stat label="Entries" value={String(payables.length)} />
          <Stat label="Total recorded" value={formatINR(outstanding)} />
          <Stat label="Next payment run" value="Friday" className="hidden md:block" />
        </dl>
      ) : null}

      {isLoading ? <SkeletonRows rows={4} /> : null}
      {error ? <ErrorNotice message={error.message} onRetry={() => mutate()} /> : null}
      {payables?.length === 0 ? (
        <EmptyState title="No payables yet">Record a supplier invoice to queue it for payment.</EmptyState>
      ) : null}

      {payables && payables.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="text-[12px] text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-2.5 pr-4 pl-6 font-medium md:pl-8">Entry</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Supplier</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Invoice</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Category</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Due</th>
                <th scope="col" className="py-2.5 pr-6 pl-4 text-right font-medium md:pr-8">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payables.map((p) => (
                <tr key={p.id} className={cn("transition-colors duration-150", p.id === createdId ? "bg-accent-soft/50" : "hover:bg-subtle/60")}>
                  <td className="py-3 pr-4 pl-6 font-mono text-[12.5px] text-muted md:pl-8">{p.id}</td>
                  <td className="px-4 py-3 text-ink">{p.vendor.name}</td>
                  <td className="px-4 py-3 font-mono text-[12.5px]">{p.invoiceNumber}</td>
                  <td className="px-4 py-3 text-ink-2">{p.category}</td>
                  <td className="tabular px-4 py-3 text-ink-2">{formatDate(p.dueDate)}</td>
                  <td className="tabular py-3 pr-6 pl-4 text-right font-medium md:pr-8">{formatINR(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("bg-surface px-6 py-4 md:px-8", className)}>
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="tabular mt-1 text-[18px] font-semibold tracking-[-0.01em]">{value}</dd>
    </div>
  );
}
