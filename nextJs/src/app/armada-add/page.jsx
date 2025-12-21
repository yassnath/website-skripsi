import Breadcrumb from "@/components/Breadcrumb";
import ArmadaAddLayer from "@/components/ArmadaAddLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Fleet - Add New | CV ANT",
  description: "Add New Fleet",
};

export default function Page() {
  return (
    <MasterLayout>
      <Breadcrumb title='Fleet – Add New' subtitle='Armada'/>
      <ArmadaAddLayer />
    </MasterLayout>
  );
}
