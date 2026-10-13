import {
  Buildings,
  ClockCounterClockwise,
  EnvelopeSimple,
  Faders,
  Receipt,
  Storefront,
  type Icon,
} from "@phosphor-icons/react";
import { NavLink, Outlet } from "react-router";
import { useEmails } from "@/lib/api";
import { cn } from "@/lib/cn";

type NavItem = { to: string; label: string; icon: Icon; badge?: number };

export function AppShell() {
  const { data: emails } = useEmails();
  const unread = emails?.filter((e) => !e.read).length ?? 0;

  const groups: Array<{ label: string; items: NavItem[] }> = [
    { label: "Communication", items: [{ to: "/mail", label: "Mail", icon: EnvelopeSimple, badge: unread }] },
    { label: "Vendor portal", items: [{ to: "/vendorly", label: "Vendorly invoices", icon: Storefront }] },
    {
      label: "Ledger",
      items: [
        { to: "/ledger/payables", label: "Payables", icon: Receipt },
        { to: "/ledger/vendors", label: "Vendors", icon: Buildings },
        { to: "/ledger/activity", label: "Activity", icon: ClockCounterClockwise },
      ],
    },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row">
      <aside className="flex flex-col border-b border-line bg-canvas md:sticky md:top-0 md:h-[100dvh] md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex h-14 items-center gap-2.5 px-4">
          <img src="/favicon.svg" alt="" width={24} height={24} className="rounded-md" />
          <div className="leading-tight">
            <p className="text-[13px] font-semibold">Acme Corp</p>
            <p className="text-[11.5px] text-muted">Finance workspace</p>
          </div>
        </div>

        <nav aria-label="Workspace" className="flex gap-4 overflow-x-auto px-2 pb-3 md:flex-col md:gap-5 md:overflow-visible md:pt-2">
          {groups.map((group) => (
            <div key={group.label} className="flex shrink-0 gap-1 md:flex-col md:gap-0.5">
              <p className="hidden px-2 pb-1 text-[11.5px] font-medium text-muted md:block">{group.label}</p>
              {group.items.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </div>
          ))}
        </nav>

        <div className="hidden px-2 pb-3 md:mt-auto md:block">
          <SidebarLink item={{ to: "/environment", label: "Environment", icon: Faders }} />
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-surface md:min-h-[100dvh]">
        <Outlet />
      </main>
    </div>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "flex h-8 items-center gap-2.5 rounded-control px-2 text-[13px] whitespace-nowrap transition-colors duration-150",
          isActive ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--color-line)]" : "text-ink-2 hover:bg-subtle hover:text-ink",
        )
      }
    >
      <Icon size={16} weight="regular" aria-hidden className="shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span className="tabular rounded-full bg-accent px-1.5 text-[11px] leading-[18px] font-semibold text-white" aria-label={`${item.badge} unread`}>
          {item.badge}
        </span>
      ) : null}
    </NavLink>
  );
}
