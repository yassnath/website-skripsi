import Breadcrumb from "@/components/Breadcrumb";
import LineChartLayer from "@/components/LineChartLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Line Chart | CV Ant",
  description: "Line Chart",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Chart - Line Chart' />

        {/* LineChartLayer */}
        <LineChartLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
