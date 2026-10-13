export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-3.5 md:px-8">
          <div className="h-3 w-24 animate-pulse rounded bg-subtle" />
          <div className="h-3 flex-1 animate-pulse rounded bg-subtle" />
          <div className="h-3 w-20 animate-pulse rounded bg-subtle" />
        </div>
      ))}
    </div>
  );
}
