import Breadcrumb from "@/components/Breadcrumb";
import CalendarMainLayer from "@/components/CalendarMainLayer";
import MasterLayout from "@/masterLayout/MasterLayout";
import { Suspense } from "react";

export const metadata = {
  title: "Calendar | CV ANT",
  description: "Calendar Page",
};

const Page = () => {
  return (
    <MasterLayout>
      <Suspense fallback={null}>
        <Breadcrumb title="Calendar" />
        <CalendarMainLayer />
      </Suspense>
    </MasterLayout>
  );
};

export default Page;
