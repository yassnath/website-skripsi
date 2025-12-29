import InvoicePublicPreview from "@/components/InvoicePublicPreview";

export default function PublicInvoicePage({ params }) {
    const { id } = params;
    const metadata = {
    title: "Invoice Public | CV ANT",
    description: "Invoice Public",
    };

  return <InvoicePublicPreview id={id} />;
}
