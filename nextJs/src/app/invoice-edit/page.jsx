import Breadcrumb from "@/components/Breadcrumb";
import InvoiceEditLayer from "@/components/InvoiceEditLayer";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Suspense } from "react";

export const metadata = {
  title: "Invoice Edit | CV ANT",
  description: "Edit Invoice",
};

const Page = () => {
  return (
    <MasterLayout>
      <Suspense fallback={null}>
        <Breadcrumb title="Invoice - Edit" />
        <InvoiceEditLayer />
      </Suspense>
    </MasterLayout>
  );
};

export default Page;
