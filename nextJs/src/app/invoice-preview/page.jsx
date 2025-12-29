import Breadcrumb from "@/components/Breadcrumb";
import InvoicePreviewLayer from "@/components/InvoicePreviewLayer";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Suspense } from "react";

export const metadata = {
  title: "Invoice Preview | CV ANT",
  description: "Invoice Preview",
};

const Page = () => {
  return (
    <MasterLayout>
      <Suspense fallback={null}>
        <Breadcrumb title="Invoice - Preview" />
        <InvoicePreviewLayer />
      </Suspense>
    </MasterLayout>
  );
};

export default Page;
