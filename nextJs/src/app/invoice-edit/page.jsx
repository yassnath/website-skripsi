import Breadcrumb from "@/components/Breadcrumb";
import InvoiceEditLayer from "@/components/InvoiceEditLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Invoice - Edit Income | CV ANT",
  description: "Invoice Edit",
};

const Page = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Invoice - Edit Income' />
        <InvoiceEditLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
