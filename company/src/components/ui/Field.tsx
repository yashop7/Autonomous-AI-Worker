import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-control border bg-surface px-3 text-[13px] text-ink placeholder:text-muted/70 transition-colors duration-150 hover:border-line-strong focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15 disabled:bg-subtle";

type FieldProps = { label: string; error?: string; hint?: ReactNode; className?: string };

// Label above control, hint and error below. The error is linked through
// aria-describedby so screen readers (and our agent) read it with the field.
function FieldShell({
  id,
  label,
  error,
  hint,
  className,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[12.5px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12.5px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export function TextField({ label, error, hint, className, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(control, "h-9", error ? "border-danger" : "border-line")}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(control, "h-9 cursor-pointer appearance-none bg-[url(/chevron.svg)] bg-[right_10px_center] bg-no-repeat pr-8", error ? "border-danger" : "border-line")}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function TextAreaField({ label, error, hint, className, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(control, "min-h-20 resize-y py-2 leading-relaxed", error ? "border-danger" : "border-line")}
        {...props}
      />
    </FieldShell>
  );
}
