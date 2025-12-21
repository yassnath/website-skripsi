import Breadcrumb from "@/components/Breadcrumb";
import ExpensePreviewLayer from "@/components/ExpensePreviewLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Invoice Expense Preview | CV ANT",
  description: "Invoice Preview",
};

const Page = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Invoice Expense - Preview' />
        <ExpensePreviewLayer />
      </MasterLayout>
    </>
  );
};

export default Page;