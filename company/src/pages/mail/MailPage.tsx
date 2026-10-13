import { ArrowLeft, EnvelopeSimpleOpen } from "@phosphor-icons/react";
import { Link, useParams } from "react-router";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useEmail, useEmails } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatReceived } from "@/lib/format";
import type { Email } from "@/lib/types";

export default function MailPage() {
  const { emailId } = useParams();
  const { data: emails, error, isLoading, mutate } = useEmails();

  return (
    <div className="grid h-[100dvh] grid-cols-1 md:grid-cols-[minmax(300px,380px)_1fr]">
      <section aria-label="Inbox" className={cn("flex min-h-0 flex-col border-line md:border-r", emailId && "hidden md:flex")}>
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <h1 className="text-[15px] font-semibold tracking-[-0.01em]">Inbox</h1>
          {emails ? <p className="tabular text-[12.5px] text-muted">{emails.length} messages</p> : null}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? <SkeletonRows rows={5} /> : null}
          {error ? <ErrorNotice message={error.message} onRetry={() => mutate()} /> : null}
          {emails?.length === 0 ? <EmptyState title="Inbox zero">New messages will show up here.</EmptyState> : null}
          <ul className="divide-y divide-line">
            {emails?.map((email) => (
              <li key={email.id}>
                <MailRow email={email} active={email.id === emailId} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="Message" className={cn("min-h-0 overflow-y-auto", !emailId && "hidden md:block")}>
        {emailId ? (
          <MailReader id={emailId} onOpened={() => mutate()} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
            <EnvelopeSimpleOpen size={28} aria-hidden />
            <p className="text-[13px]">Select a message to read it</p>
          </div>
        )}
      </section>
    </div>
  );
}

function MailRow({ email, active }: { email: Email; active: boolean }) {
  const preview = email.body.replace(/\s+/g, " ").slice(0, 110);
  return (
    <Link
      to={`/mail/${email.id}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block px-5 py-3.5 transition-colors duration-150",
        active ? "bg-accent-soft/60" : "hover:bg-subtle/70",
      )}
    >
      <div className="flex items-baseline gap-2">
        {!email.read ? <span className="size-1.5 shrink-0 translate-y-[-2px] rounded-full bg-accent" aria-label="Unread" /> : null}
        <p className={cn("min-w-0 flex-1 truncate text-[13px]", email.read ? "text-ink-2" : "font-semibold text-ink")}>
          {email.from.name}
        </p>
        <time dateTime={email.receivedAt} className="tabular shrink-0 text-[12px] text-muted">
          {formatReceived(email.receivedAt)}
        </time>
      </div>
      <p className={cn("mt-0.5 truncate text-[13px]", email.read ? "text-ink-2" : "font-medium text-ink")}>{email.subject}</p>
      <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted">{preview}</p>
    </Link>
  );
}

function MailReader({ id, onOpened }: { id: string; onOpened: () => void }) {
  const { data: email, error, isLoading } = useEmail(id, onOpened);

  if (isLoading) return <SkeletonRows rows={3} />;
  if (error || !email) return <ErrorNotice message={error?.message ?? "Message not found"} />;

  return (
    <article className="mx-auto max-w-[720px] px-6 py-6 md:px-10 md:py-8">
      <Link to="/mail" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink md:hidden">
        <ArrowLeft size={14} aria-hidden /> Inbox
      </Link>
      <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-balance">{email.subject}</h2>
      <div className="mt-4 flex items-center gap-3 border-b border-line pb-5">
        <div aria-hidden className="grid size-9 place-items-center rounded-full bg-subtle text-[13px] font-semibold text-ink-2">
          {initials(email.from.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium">{email.from.name}</p>
          <p className="truncate text-[12.5px] text-muted">{email.from.email}</p>
        </div>
        <time dateTime={email.receivedAt} className="text-[12.5px] text-muted">
          {new Date(email.receivedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
        </time>
      </div>
      <div className="mt-6 max-w-[65ch] text-[14px] leading-[1.7] whitespace-pre-line text-ink-2">{email.body}</div>
    </article>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
