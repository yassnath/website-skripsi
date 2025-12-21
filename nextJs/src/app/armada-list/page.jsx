import Breadcrumb from "@/components/Breadcrumb";
import ArmadaListLayer from "@/components/ArmadaListLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Fleet - List | CV ANT",
  description: "Fleet List",
};

export default function Page() {
  return (
    <MasterLayout>
      <Breadcrumb title="Fleet – List" subtitle="Armada" />
      <ArmadaListLayer />
    </MasterLayout>
  );
}
