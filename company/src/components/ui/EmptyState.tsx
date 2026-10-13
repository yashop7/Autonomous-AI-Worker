import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="text-[14px] font-medium text-ink">{title}</p>
      {children ? <div className="max-w-[44ch] text-[13px] text-muted">{children}</div> : null}
    </div>
  );
}
