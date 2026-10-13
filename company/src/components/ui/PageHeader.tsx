import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-6 pt-6 pb-5 md:px-8">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-[65ch] text-[13px] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
