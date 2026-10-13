import { Link } from "react-router";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useVendors } from "@/lib/api";

export default function VendorsPage() {
  const { data: vendors, error, isLoading, mutate } = useVendors();
  return (
    <div>
      <PageHeader title="Vendors" description="Supplier master data used for payments and tax filings." />
      {isLoading ? <SkeletonRows rows={5} /> : null}
      {error ? <ErrorNotice message={error.message} onRetry={() => mutate()} /> : null}
      <ul className="divide-y divide-line">
        {vendors?.map((v) => (
          <li key={v.id}>
            <Link to={`/ledger/vendors/${v.id}`} className="grid gap-1 px-6 py-4 transition-colors duration-150 hover:bg-subtle/60 md:grid-cols-[minmax(220px,1fr)_2fr_auto] md:items-center md:gap-6 md:px-8">
              <span className="text-[13px] font-medium text-ink">{v.name}</span>
              <span className="truncate text-[13px] text-muted">{v.address}</span>
              <span className="text-[12.5px] text-muted">Net {v.paymentTermsDays}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
