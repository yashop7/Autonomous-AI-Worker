import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { SkeletonRows } from "./components/ui/Skeleton";

// Each app is split into its own chunk; the shell renders immediately.
const MailPage = lazy(() => import("./pages/mail/MailPage"));
const InvoicesPage = lazy(() => import("./pages/vendorly/InvoicesPage"));
const InvoiceDetailPage = lazy(() => import("./pages/vendorly/InvoiceDetailPage"));
const PayablesPage = lazy(() => import("./pages/ledger/PayablesPage"));
const NewPayablePage = lazy(() => import("./pages/ledger/NewPayablePage"));
const VendorsPage = lazy(() => import("./pages/ledger/VendorsPage"));
const VendorDetailPage = lazy(() => import("./pages/ledger/VendorDetailPage"));
const ActivityPage = lazy(() => import("./pages/ledger/ActivityPage"));
const EnvironmentPage = lazy(() => import("./pages/EnvironmentPage"));

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/mail" replace />} />
        <Route path="mail/:emailId?" element={<Page><MailPage /></Page>} />
        <Route path="vendorly" element={<Page><InvoicesPage /></Page>} />
        <Route path="vendorly/invoices/:invoiceId" element={<Page><InvoiceDetailPage /></Page>} />
        <Route path="ledger" element={<Navigate to="/ledger/payables" replace />} />
        <Route path="ledger/payables" element={<Page><PayablesPage /></Page>} />
        <Route path="ledger/payables/new" element={<Page><NewPayablePage /></Page>} />
        <Route path="ledger/vendors" element={<Page><VendorsPage /></Page>} />
        <Route path="ledger/vendors/:vendorId" element={<Page><VendorDetailPage /></Page>} />
        <Route path="ledger/activity" element={<Page><ActivityPage /></Page>} />
        <Route path="environment" element={<Page><EnvironmentPage /></Page>} />
        <Route path="*" element={<Navigate to="/mail" replace />} />
      </Route>
    </Routes>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<SkeletonRows rows={6} />}>{children}</Suspense>;
}
