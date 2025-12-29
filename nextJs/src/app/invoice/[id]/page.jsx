export default function PublicInvoicePage({ params }) {
  const { id } = params;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 16px",
        }}
      >
        <h2 style={{ marginBottom: 12, fontWeight: 700 }}>
          Invoice #{id}
        </h2>

        <p style={{ marginBottom: 20, color: "#666" }}>
          Halaman ini adalah invoice publik. Anda dapat melihat invoice dan mengunduhnya.
        </p>

        <div
          style={{
            width: "100%",
            height: "85vh",
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
          }}
        >
          <iframe
            src={`/invoice/${id}/pdf`}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>

        <div style={{ marginTop: 18 }}>
          <a
            href={`/invoice/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "#198754",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Download / Open PDF
          </a>
        </div>
      </div>
    </div>
  );
}
