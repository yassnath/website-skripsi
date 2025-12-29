import MasterLayout from "@/masterLayout/MasterLayout";
import DashboardLayerOne from "@/components/DashboardLayerOne.jsx";

export const metadata = {
  title: "Dashboard | CV ANT",
  description: "Main dashboard CV ANT",
};

export default function HomePage() {
  return (
    <MasterLayout>
      <DashboardLayerOne />
    </MasterLayout>
  );
}
