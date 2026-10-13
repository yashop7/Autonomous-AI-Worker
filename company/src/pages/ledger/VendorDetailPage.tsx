import { ArrowLeft, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { api, ApiError, useVendor } from "@/lib/api";
import type { Vendor } from "@/lib/types";

export default function VendorDetailPage() {
  const { vendorId } = useParams();
  const { data: vendor, error, isLoading } = useVendor(vendorId);

  return (
    <div>
      <div className="px-6 pt-5 md:px-8">
        <Link to="/ledger/vendors" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
          <ArrowLeft size={14} aria-hidden /> Vendors
        </Link>
      </div>
      {isLoading ? <SkeletonRows rows={4} /> : null}
      {error ? <ErrorNotice message={error.message} /> : null}
      {/* key resets the form when navigating between vendors */}
      {vendor ? <VendorForm key={vendor.id} vendor={vendor} /> : null}
    </div>
  );
}

function VendorForm({ vendor }: { vendor: Vendor }) {
  const { mutate } = useSWRConfig();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Editing a field clears its error, so a stale message never outlives the fix
  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name;
    if (fieldErrors[name]) setFieldErrors(({ [name]: _, ...rest }) => rest);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      const updated = await api<Vendor>(`/ledger/vendors/${vendor.id}`, { method: "PATCH", body: JSON.stringify(data) });
      await Promise.all([mutate(`/ledger/vendors/${vendor.id}`, updated), mutate("/ledger/vendors"), mutate("/ledger/activity")]);
      setMessage({ tone: "ok", text: "Vendor details saved" });
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.fields);
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Couldn't save vendor details" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={vendor.name} description={`GSTIN ${vendor.gstin} · Net ${vendor.paymentTermsDays} payment terms`} />
      <form onSubmit={handleSubmit} onInput={clearFieldError} onChange={clearFieldError} noValidate aria-label="Vendor details" className="max-w-[640px] px-6 py-6 md:px-8">
        {message ? (
          <div
            role={message.tone === "ok" ? "status" : "alert"}
            className={
              message.tone === "ok"
                ? "mb-6 flex items-center gap-2.5 rounded-panel border border-ok/20 bg-ok-soft px-4 py-3 text-[13px] text-ok"
                : "mb-6 flex items-center gap-2.5 rounded-panel border border-danger/20 bg-danger-soft px-4 py-3 text-[13px] text-danger"
            }
          >
            {message.tone === "ok" ? <CheckCircle size={18} weight="fill" aria-hidden /> : <WarningCircle size={18} weight="fill" aria-hidden />}
            <p>{message.text}</p>
          </div>
        ) : null}
        <div className="grid gap-5">
          <TextField label="Billing email" name="email" type="email" defaultValue={vendor.email} error={fieldErrors.email} />
          <TextAreaField label="Billing address" name="address" defaultValue={vendor.address} error={fieldErrors.address} rows={3} />
        </div>
        <div className="mt-8 border-t border-line pt-5">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save vendor"}
          </Button>
        </div>
      </form>
    </>
  );
}
