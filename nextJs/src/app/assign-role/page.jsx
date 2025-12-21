import AssignRoleLayer from "@/components/AssignRoleLayer";
import Breadcrumb from "@/components/Breadcrumb";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Assign Role | CV Ant",
  description: "Assign Role",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Assign Role' />

        {/* AssignRoleLayer */}
        <AssignRoleLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
