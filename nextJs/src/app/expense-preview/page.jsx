import Breadcrumb from "@/components/Breadcrumb";
import ExpensePreviewLayer from "@/components/ExpensePreviewLayer";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Suspense } from "react";

export const metadata = {
  title: "Invoice Expense Preview | CV ANT",
  description: "Invoice Preview",
};

const Page = () => {
  return (
    <>
      <MasterLayout>
        <Suspense fallback={null}>
          <Breadcrumb title='Invoice Expense - Preview' />
          <ExpensePreviewLayer />
        </Suspense>
      </MasterLayout>
    </>
  );
};

export default Page;