import Breadcrumb from "@/components/Breadcrumb";
import MasterLayout from "@/masterLayout/MasterLayout";
import ArmadaEditLayer from "@/components/ArmadaEditLayer";

export const metadata = {
  title: "Fleet - Edit | CV ANT",
  description: "Fleet Edit",
};

export default function Page({ params }) {
  return (
    <MasterLayout>
      <Breadcrumb title="Fleet – Edit" subtitle="Armada" />
      <ArmadaEditLayer id={params.id} />
    </MasterLayout>
  );
}
