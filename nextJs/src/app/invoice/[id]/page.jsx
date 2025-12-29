export default async function InvoicePublicPage({ params }) {
  const { id } = params;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const pdfUrl = `${site.replace(/\/+$/, "")}/invoice/${id}/pdf`;

  return (
    <div style={{ padding: "24px" }}>
      <h2>Invoice #{id}</h2>
      <p>Silakan klik tombol di bawah untuk melihat invoice PDF.</p>

      <a
        href={pdfUrl}
        target="_blank"
        style={{
          display: "inline-block",
          padding: "12px 18px",
          background: "#2563eb",
          color: "white",
          borderRadius: "10px",
          textDecoration: "none",
        }}
      >
        View PDF Invoice
      </a>

      <div style={{ marginTop: "20px" }}>
        <iframe
          src={pdfUrl}
          width="100%"
          height="850px"
          style={{ border: "1px solid #ddd", borderRadius: "10px" }}
        />
      </div>
    </div>
  );
}
