import Breadcrumb from "@/components/Breadcrumb";
import InvoiceExpenseEdit from "@/components/InvoiceExpenseEdit";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Suspense } from "react";

export const metadata = {
  title: "Invoice Expense Edit | CV ANT",
  description: "Edit Invoice Expense",
};

const Page = () => {
  return (
    <MasterLayout>
      <Suspense fallback={null}>
        <Breadcrumb title="Invoice Expense - Edit" />
        <InvoiceExpenseEdit />
      </Suspense>
    </MasterLayout>
  );
};

export default Page;
