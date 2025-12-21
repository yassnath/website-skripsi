import Breadcrumb from "@/components/Breadcrumb";
import InvoicePreviewLayer from "@/components/InvoicePreviewLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Invoice Income Preview | CV ANT",
  description: "Invoice Preview",
};

const Page = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Invoice Income - Preview' />
        <InvoicePreviewLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
