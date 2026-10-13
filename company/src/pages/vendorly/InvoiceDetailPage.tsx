import { ArrowLeft } from "@phosphor-icons/react";
import { Link, useParams } from "react-router";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInvoice } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/format";
import { VendorlyFrame } from "./VendorlyFrame";

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const { data: inv, error, isLoading } = useInvoice(invoiceId);

  return (
    <VendorlyFrame>
      <div className="px-6 pt-5 md:px-8">
        <Link to="/vendorly" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
          <ArrowLeft size={14} aria-hidden /> All invoices
        </Link>
      </div>

      {isLoading ? <SkeletonRows rows={6} /> : null}
      {error ? <ErrorNotice message={error.message} /> : null}

      {inv ? (
        <div className="px-4 py-6 md:px-8">
          {/* The invoice is rendered like the PDF a supplier would send */}
          <article aria-label={`Invoice ${inv.number}`} className="mx-auto max-w-[820px] rounded-panel border border-line bg-surface shadow-pop">
            <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line p-6 md:p-8">
              <div>
                <p className="text-[17px] font-semibold tracking-[-0.01em]">{inv.vendor.name}</p>
                <p className="mt-1 max-w-[38ch] text-[13px] leading-relaxed text-muted">{inv.vendor.address}</p>
                <p className="mt-1 font-mono text-[12px] text-muted">GSTIN {inv.vendor.gstin}</p>
              </div>
              <div className="text-right">
                <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Tax invoice</h1>
                <div className="mt-2 flex justify-end">
                  <StatusBadge status={inv.status} dueDate={inv.dueDate} />
                </div>
              </div>
            </header>

            <div className="grid gap-6 border-b border-line p-6 md:grid-cols-2 md:p-8">
              <div>
                <h2 className="text-[12px] font-medium text-muted">Billed to</h2>
                <p className="mt-1.5 text-[13px] font-medium">Acme Corp Pvt Ltd</p>
                <p className="text-[13px] text-ink-2">Accounts Payable, Sector 62, Noida, Uttar Pradesh 201309</p>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[13px]">
                <dt className="text-muted">Invoice number</dt>
                <dd className="font-mono font-medium">{inv.number}</dd>
                <dt className="text-muted">Invoice date</dt>
                <dd className="tabular">{formatDate(inv.issueDate)}</dd>
                <dt className="text-muted">Due date</dt>
                <dd className="tabular font-medium">{formatDate(inv.dueDate)}</dd>
                <dt className="text-muted">PO number</dt>
                <dd className="font-mono">{inv.poNumber}</dd>
              </dl>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead className="text-[12px] text-muted">
                  <tr className="border-b border-line">
                    <th scope="col" className="py-2.5 pr-4 pl-6 text-left font-medium md:pl-8">Description</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Qty</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Unit price</th>
                    <th scope="col" className="py-2.5 pr-6 pl-4 text-right font-medium md:pr-8">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {inv.lineItems.map((li) => (
                    <tr key={li.description}>
                      <td className="py-3 pr-4 pl-6 text-ink-2 md:pl-8">{li.description}</td>
                      <td className="tabular px-4 py-3 text-right">{li.quantity}</td>
                      <td className="tabular px-4 py-3 text-right">{formatINR(li.unitPrice)}</td>
                      <td className="tabular py-3 pr-6 pl-4 text-right md:pr-8">{formatINR(li.quantity * li.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="ml-auto grid max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-2 border-t border-line p-6 text-[13px] md:p-8">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular text-right">{formatINR(inv.subtotal)}</dd>
              <dt className="text-muted">GST ({Math.round(inv.taxRate * 100)}%)</dt>
              <dd className="tabular text-right">{formatINR(inv.tax)}</dd>
              <dt className="border-t border-line pt-2 font-medium">Total due</dt>
              <dd className="tabular border-t border-line pt-2 text-right text-[15px] font-semibold">{formatINR(inv.total)}</dd>
            </dl>
          </article>
        </div>
      ) : null}
    </VendorlyFrame>
  );
}
