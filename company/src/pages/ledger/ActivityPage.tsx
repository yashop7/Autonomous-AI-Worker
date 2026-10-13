import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useActivity } from "@/lib/api";

const timeFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Kolkata" });

export default function ActivityPage() {
  const { data: activity } = useActivity();
  return (
    <div>
      <PageHeader title="Activity" description="Audit trail of every change made in Ledger during this session." />
      {activity?.length === 0 ? <EmptyState title="No changes yet">New payables and vendor updates are logged here.</EmptyState> : null}
      <ol className="divide-y divide-line">
        {activity?.map((a) => (
          <li key={a.id} className="grid gap-1 px-6 py-3.5 md:grid-cols-[200px_160px_1fr] md:gap-6 md:px-8">
            <time dateTime={a.at} className="tabular text-[12.5px] text-muted">{timeFmt.format(new Date(a.at))}</time>
            <span className="font-mono text-[12px] text-ink-2">{a.action}</span>
            <span className="text-[13px] text-ink">{a.detail}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
