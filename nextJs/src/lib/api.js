const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const buildHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (res, method, url) => {
  const text = await res.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && data.message) ||
      `Request ${method} ${url} gagal dengan status ${res.status}`;
    throw new Error(message);
  }

  return data;
};

export const api = {
  get: async (url) => {
    const res = await fetch(`${API_URL}/api${url}`, {
      method: "GET",
      headers: buildHeaders(),
    });
    return handleResponse(res, "GET", url);
  },

  post: async (url, body) => {
    const res = await fetch(`${API_URL}/api${url}`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res, "POST", url);
  },

  put: async (url, body) => {
    const res = await fetch(`${API_URL}/api${url}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res, "PUT", url);
  },

  delete: async (url) => {
    const res = await fetch(`${API_URL}/api${url}`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    return handleResponse(res, "DELETE", url);
  },
};
