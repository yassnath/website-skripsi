import Breadcrumb from "@/components/Breadcrumb";
import InvoiceExpense from "@/components/InvoiceExpense";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Suspense } from "react";

export const metadata = {
  title: "Invoice - Add Expense | CV ANT",
  description: "Add Invoice Expense",
};

const Page = () => {
  return (
    <MasterLayout>
      <Suspense fallback={null}>
        <Breadcrumb title="Invoice - Add Expense" />
        <InvoiceExpense />
      </Suspense>
    </MasterLayout>
  );
};

export default Page;
