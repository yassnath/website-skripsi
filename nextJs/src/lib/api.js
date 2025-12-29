// nextJs/src/lib/api.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Semua request otomatis menuju:
 *   `${API_URL}/api/...`
 */
const buildUrl = (url) => {
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}/api${path}`;
};

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const defaultHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function handleResponse(res) {
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export const api = {
  get: async (url) => {
    const res = await fetch(buildUrl(url), {
      method: "GET",
      headers: defaultHeaders(),
    });
    return handleResponse(res);
  },

  post: async (url, body) => {
    const res = await fetch(buildUrl(url), {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  put: async (url, body) => {
    const res = await fetch(buildUrl(url), {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  delete: async (url) => {
    const res = await fetch(buildUrl(url), {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    return handleResponse(res);
  },
};
