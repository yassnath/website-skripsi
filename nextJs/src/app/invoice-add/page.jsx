import Breadcrumb from "@/components/Breadcrumb";
import InvoiceAddLayer from "@/components/InvoiceAddLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Invoice - Add Income | CV ANT",
  description:
    "Add Invoice",
};

const Page = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Invoice - Add Income' />
        <InvoiceAddLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
