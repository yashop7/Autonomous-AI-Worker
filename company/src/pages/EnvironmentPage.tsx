import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { api, useSettings } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Settings } from "@/lib/types";

const SWITCHES: Array<{ key: keyof Settings; title: string; description: string }> = [
  {
    key: "cookieBanner",
    title: "Vendorly cookie dialog",
    description: "A consent dialog blocks the vendor portal until someone answers it.",
  },
  {
    key: "strictDates",
    title: "Strict date format in Ledger",
    description: "Ledger rejects any date that isn't written as DD/MM/YYYY.",
  },
  {
    key: "flakySubmit",
    title: "Flaky Ledger saves",
    description: "The first save of each payable fails with a temporary 503 error.",
  },
  {
    key: "slowNetwork",
    title: "Slow network",
    description: "Every request takes an extra 0.3 to 1.2 seconds.",
  },
];

export default function EnvironmentPage() {
  const { mutate } = useSWRConfig();
  const { data: settings, mutate: mutateSettings } = useSettings();
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function toggle(key: keyof Settings) {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    // Optimistic: flip immediately, roll back if the server rejects it
    await mutateSettings(api<Settings>("/settings", { method: "PATCH", body: JSON.stringify({ [key]: next[key] }) }), {
      optimisticData: next,
      rollbackOnError: true,
    });
  }

  async function reset() {
    setResetting(true);
    setResetDone(false);
    await api("/reset?keepSettings=1", { method: "POST" });
    try {
      sessionStorage.clear();
    } catch {
      // ignore unavailable storage
    }
    await mutate(() => true); // revalidate every cached request
    setResetting(false);
    setResetDone(true);
  }

  return (
    <div>
      <PageHeader
        title="Environment"
        description="Controls for this simulated workspace. Turn on obstacles to test how the AI worker recovers, or reset all data to the starting state."
        actions={
          <Button onClick={reset} disabled={resetting}>
            <ArrowCounterClockwise size={14} aria-hidden />
            {resetting ? "Resetting…" : "Reset data"}
          </Button>
        }
      />
      {resetDone ? (
        <p role="status" className="px-6 pt-4 text-[13px] text-ok md:px-8">
          Data restored to the starting state.
        </p>
      ) : null}
      <ul className="max-w-[760px] divide-y divide-line">
        {SWITCHES.map((s) => {
          const on = settings?.[s.key] ?? false;
          return (
            <li key={s.key} className="flex items-center justify-between gap-6 px-6 py-4 md:px-8">
              <div>
                <p id={`${s.key}-label`} className="text-[13px] font-medium">{s.title}</p>
                <p className="mt-0.5 text-[13px] text-muted">{s.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-labelledby={`${s.key}-label`}
                disabled={!settings}
                onClick={() => toggle(s.key)}
                className={cn(
                  "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-150",
                  on ? "bg-accent" : "bg-line-strong",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-150",
                    on && "translate-x-4",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
