import Breadcrumb from "@/components/Breadcrumb";
import CalendarMainLayer from "@/components/CalendarMainLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Calendar | CV ANT",
  description: "Calendar CV ANT",
};

const Page = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Calendar' />
        <CalendarMainLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
