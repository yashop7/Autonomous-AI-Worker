import { Link, useSearchParams } from "react-router";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInvoices, useVendors } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate, formatINR } from "@/lib/format";
import { VendorlyFrame } from "./VendorlyFrame";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
] as const;

export default function InvoicesPage() {
  const [params, setParams] = useSearchParams();
  const vendor = params.get("vendor") ?? "";
  const status = params.get("status") ?? "";
  const query = new URLSearchParams({ ...(vendor && { vendor }), ...(status && { status }) }).toString();

  const { data: vendors } = useVendors();
  const { data: invoices, error, isLoading, mutate } = useInvoices(query ? `?${query}` : "");

  function setFilter(key: "vendor" | "status", value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <VendorlyFrame>
      <PageHeader title="Invoices" description="Invoices your suppliers have shared with Acme Corp, newest first." />

      <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-3 md:px-8">
        <label className="flex items-center gap-2 text-[13px] text-ink-2">
          <span>Supplier</span>
          <select
            value={vendor}
            onChange={(e) => setFilter("vendor", e.target.value)}
            className="h-8 cursor-pointer appearance-none rounded-control border border-line bg-surface bg-[url(/chevron.svg)] bg-[right_8px_center] bg-no-repeat pr-7 pl-2.5 text-[13px] hover:border-line-strong focus:border-accent focus:outline-none"
          >
            <option value="">All suppliers</option>
            {vendors?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <div role="group" aria-label="Status" className="flex rounded-control border border-line bg-subtle p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={status === f.value}
              onClick={() => setFilter("status", f.value)}
              className={cn(
                "h-7 cursor-pointer rounded-[6px] px-2.5 text-[12.5px] font-medium transition-colors duration-150",
                status === f.value ? "bg-surface text-ink shadow-[0_0_0_1px_var(--color-line)]" : "text-muted hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <SkeletonRows rows={6} /> : null}
      {error ? <ErrorNotice message={error.message} onRetry={() => mutate()} /> : null}
      {invoices?.length === 0 ? (
        <EmptyState title="No invoices match these filters">Clear the supplier or status filter to see every invoice.</EmptyState>
      ) : null}

      {invoices && invoices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="text-[12px] text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-2.5 pr-4 pl-6 font-medium md:pl-8">Invoice</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Supplier</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Issued</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Due</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th scope="col" className="py-2.5 pr-6 pl-4 font-medium md:pr-8">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {invoices.map((inv) => (
                <tr key={inv.id} className="group transition-colors duration-150 hover:bg-subtle/60">
                  <td className="py-3 pr-4 pl-6 md:pl-8">
                    <Link to={`/vendorly/invoices/${inv.id}`} className="font-mono text-[12.5px] font-medium text-ink underline-offset-2 group-hover:underline">
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{inv.vendor.name}</td>
                  <td className="tabular px-4 py-3 text-ink-2">{formatDate(inv.issueDate)}</td>
                  <td className="tabular px-4 py-3 text-ink-2">{formatDate(inv.dueDate)}</td>
                  <td className="tabular px-4 py-3 text-right font-medium">{formatINR(inv.total)}</td>
                  <td className="py-3 pr-6 pl-4 md:pr-8">
                    <StatusBadge status={inv.status} dueDate={inv.dueDate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </VendorlyFrame>
  );
}
