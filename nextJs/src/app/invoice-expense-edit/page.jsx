import Breadcrumb from "@/components/Breadcrumb";
import InvoiceExpenseEdit from "@/components/InvoiceExpenseEdit";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Invoice - Edit Expense | CV ANT",
  description: "Invoice List",
};

const Page = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Invoice - Edit Expense' />
        <InvoiceExpenseEdit />
      </MasterLayout>
    </>
  );
};

export default Page;
