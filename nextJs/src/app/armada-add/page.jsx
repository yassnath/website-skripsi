import Breadcrumb from "@/components/Breadcrumb";
import ArmadaAddLayer from "@/components/ArmadaAddLayer";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Suspense } from "react";

export const metadata = {
  title: "Fleet - Add New | CV ANT",
  description: "Add Fleet",
};

const Page = () => {
  return (
    <MasterLayout>
      <Suspense fallback={null}>
        <Breadcrumb title="Fleet - Add New" />
        <ArmadaAddLayer />
      </Suspense>
    </MasterLayout>
  );
};

export default Page;
