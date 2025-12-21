import Breadcrumb from "@/components/Breadcrumb";
import RoleAccessLayer from "@/components/RoleAccessLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Role Access | CV Ant",
  description: "Role Access",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Role Access' />

        {/* RoleAccessLayer */}
        <RoleAccessLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
