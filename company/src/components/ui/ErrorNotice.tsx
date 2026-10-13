import { WarningCircle } from "@phosphor-icons/react";

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-6 my-6 flex items-start gap-3 rounded-panel border border-danger/20 bg-danger-soft px-4 py-3 text-[13px] text-danger md:mx-8">
      <WarningCircle size={18} weight="fill" className="mt-px shrink-0" aria-hidden />
      <p className="flex-1">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="cursor-pointer font-medium underline underline-offset-2">
          Try again
        </button>
      ) : null}
    </div>
  );
}
