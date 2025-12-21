import Breadcrumb from "@/components/Breadcrumb";
import ImageUploadLayer from "@/components/ImageUploadLayer";
import MasterLayout from "@/masterLayout/MasterLayout";

export const metadata = {
  title: "Image Upload | CV Ant",
  description: "Image Upload",
};

const Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Components / Image Upload' />

        {/* ImageUploadLayer */}
        <ImageUploadLayer />
      </MasterLayout>
    </>
  );
};

export default Page;
