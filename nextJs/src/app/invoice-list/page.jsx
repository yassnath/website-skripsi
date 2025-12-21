import Breadcrumb from "@/components/Breadcrumb";
import InvoiceListLayer from "@/components/InvoiceListLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Invoice - List | CV ANT",
  description: "Invoice List",
};

const Page = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Invoice - List' />
        <InvoiceListLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
