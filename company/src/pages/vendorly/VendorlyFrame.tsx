import { Storefront } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/lib/api";

const CONSENT_KEY = "vendorly-consent:v1";

function readConsent() {
  try {
    return sessionStorage.getItem(CONSENT_KEY) !== null;
  } catch {
    return false;
  }
}

// Vendorly is a third-party portal, so it gets its own top bar. When the
// cookieBanner chaos switch is on, a consent dialog blocks the page until it's
// answered: a realistic obstacle the agent has to notice and clear.
export function VendorlyFrame({ children }: { children: ReactNode }) {
  const { data: settings } = useSettings();
  const [consented, setConsented] = useState(readConsent);

  function answer(choice: "all" | "necessary") {
    try {
      sessionStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // Storage can be unavailable; the dialog still closes for this page view
    }
    setConsented(true);
  }

  const showConsent = settings?.cookieBanner && !consented;

  return (
    <div className="min-h-[100dvh]">
      <div className="flex h-11 items-center gap-2 border-b border-line bg-ink px-6 text-white md:px-8">
        <Storefront size={16} weight="fill" aria-hidden />
        <p className="text-[13px] font-semibold tracking-[-0.01em]">Vendorly</p>
        <p className="text-[12.5px] text-white/60">Supplier billing portal · signed in as Acme Corp</p>
      </div>
      <div inert={showConsent ? true : undefined}>{children}</div>

      {showConsent ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-title"
            className="w-full max-w-md rounded-panel border border-line bg-surface p-6 shadow-pop"
          >
            <h2 id="consent-title" className="text-[16px] font-semibold tracking-[-0.01em]">
              Cookies on Vendorly
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
              We use necessary cookies to keep you signed in. With your permission we also use analytics cookies to improve the
              portal. Choose an option to continue.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => answer("necessary")}>Necessary only</Button>
              <Button variant="primary" onClick={() => answer("all")}>
                Accept all
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
