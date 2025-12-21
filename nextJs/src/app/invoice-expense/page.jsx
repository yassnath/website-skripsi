import Breadcrumb from "@/components/Breadcrumb";
import InvoiceExpense from "@/components/InvoiceExpense";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Invoice - Add Expense | CV ANT",
  description:
    "Add Invoice",
};

const Page = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Invoice - Add Expense' />
        <InvoiceExpense />
      </MasterLayout>
    </>
  );
};

export default Page;
