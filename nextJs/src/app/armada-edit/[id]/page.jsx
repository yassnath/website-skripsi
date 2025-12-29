import Breadcrumb from "@/components/Breadcrumb";
import MasterLayout from "@/masterLayout/MasterLayout";
import ArmadaEditLayer from "@/components/ArmadaEditLayer";
import { Suspense } from "react";

export const metadata = {
  title: "Fleet - Edit | CV ANT",
  description: "Fleet Edit",
};

export default function Page({ params }) {
  return (
    <MasterLayout>
      <Suspense fallback={null}>
        <Breadcrumb title="Fleet – Edit" subtitle="Armada" />
        <ArmadaEditLayer id={params.id} />
      </Suspense>
    </MasterLayout>
  );
}
