import InvoicePublicPreview from "@/components/InvoicePublicPreview";

export default function PublicInvoicePage({ params }) {
  return <InvoicePublicPreview id={params.id} />;
}
