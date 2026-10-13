import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover border-transparent",
  secondary: "bg-surface text-ink border-line-strong hover:bg-subtle",
  ghost: "bg-transparent text-ink-2 border-transparent hover:bg-subtle hover:text-ink",
  danger: "bg-surface text-danger border-line-strong hover:bg-danger-soft",
};

export function Button({
  variant = "secondary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-control border px-3 text-[13px] font-medium",
        "transition-[background-color,color,transform] duration-150 active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
