const normalizeDate = (value) => {
  if (!value) return "";
  const str = String(value).trim();

  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    return str.split("T")[0];
  }

  if (/^\d{4}-\d{2}-\d{2}\s/.test(str)) return str.split(" ")[0];
  return "";
};

const getMonthFromDate = (value) => {
  const norm = normalizeDate(value);
  if (!norm) return "";
  const [, m] = norm.split("-");
  return m || "";
};

export const formatInvoiceNumber = (value, tanggal) => {
  const raw = String(value || "").trim();
  if (!raw) return "-";

  const upper = raw.toUpperCase();
  if (/^(INC|EXP)-\d{2}-\d{4}-\d{4}$/.test(upper)) return upper;

  const match = upper.match(/^(INC|EXP)-(\d{4})-(\d{4})$/);
  if (!match) return raw;

  const month = getMonthFromDate(tanggal);
  if (!month) return raw;

  return `${match[1]}-${month}-${match[2]}-${match[3]}`;
};
