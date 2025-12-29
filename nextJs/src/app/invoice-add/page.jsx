import Breadcrumb from "@/components/Breadcrumb";
import InvoiceAddLayer from "@/components/InvoiceAddLayer";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Suspense } from "react";

export const metadata = {
  title: "Invoice - Add Income | CV ANT",
  description: "Add Invoice Income",
};

const Page = () => {
  return (
    <MasterLayout>
      <Suspense fallback={null}>
        <Breadcrumb title="Invoice - Add Income" />
        <InvoiceAddLayer />
      </Suspense>
    </MasterLayout>
  );
};

export default Page;
