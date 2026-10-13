import { ArrowLeft, WarningCircle } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { api, ApiError, useVendors } from "@/lib/api";
import { CATEGORIES, type Payable } from "@/lib/types";

export default function NewPayablePage() {
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const { data: vendors } = useVendors();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Uncontrolled form: values are read once on submit, so typing never re-renders the page
  // Editing a field clears its error, so a stale message never outlives the fix
  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name;
    if (fieldErrors[name]) setFieldErrors(({ [name]: _, ...rest }) => rest);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const payable = await api<Payable>("/ledger/payables", { method: "POST", body: JSON.stringify(data) });
      await Promise.all([mutate("/ledger/payables"), mutate("/ledger/activity")]);
      navigate(`/ledger/payables?created=${payable.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fields);
        setFormError(err.message);
      } else {
        setFormError("Couldn't reach Ledger. Check your connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="px-6 pt-5 md:px-8">
        <Link to="/ledger/payables" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
          <ArrowLeft size={14} aria-hidden /> Payables
        </Link>
      </div>
      <PageHeader title="New payable" description="Record a supplier invoice so it's included in the next payment run." />

      <form onSubmit={handleSubmit} onInput={clearFieldError} onChange={clearFieldError} noValidate aria-label="New payable" className="max-w-[640px] px-6 py-6 md:px-8">
        {formError ? (
          <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-panel border border-danger/20 bg-danger-soft px-4 py-3 text-[13px] text-danger">
            <WarningCircle size={18} weight="fill" className="mt-px shrink-0" aria-hidden />
            <p>{formError}</p>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <SelectField label="Supplier" name="vendorId" defaultValue="" error={fieldErrors.vendorId} className="md:col-span-2">
            <option value="" disabled>
              Choose a supplier
            </option>
            {vendors?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </SelectField>

          <TextField label="Invoice number" name="invoiceNumber" autoComplete="off" spellCheck={false} error={fieldErrors.invoiceNumber} />
          <TextField label="Amount (₹, incl. GST)" name="amount" inputMode="decimal" autoComplete="off" error={fieldErrors.amount} />
          <TextField label="Invoice date" name="invoiceDate" autoComplete="off" error={fieldErrors.invoiceDate} />
          <TextField label="Due date" name="dueDate" autoComplete="off" error={fieldErrors.dueDate} />

          <SelectField label="Category" name="category" defaultValue="" error={fieldErrors.category} className="md:col-span-2">
            <option value="" disabled>
              Choose a category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>

          <TextAreaField label="Notes" name="notes" hint="Optional. Visible to the finance team." className="md:col-span-2" />
        </div>

        <div className="mt-8 flex items-center gap-2 border-t border-line pt-5">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save payable"}
          </Button>
          <Link to="/ledger/payables" className="inline-flex h-8 items-center rounded-control px-3 text-[13px] font-medium text-ink-2 hover:bg-subtle">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
