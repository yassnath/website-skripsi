const API = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL + "/api"
  : "http://localhost:8080/api";

export async function loginRequest(username, password) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Login gagal");
  }

  return data;
}

export async function me() {
  const res = await fetch(`${API}/me`, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    return { authenticated: false };
  }

  return data;
}

export async function logoutRequest() {
  await fetch(`${API}/logout`, {
    method: "POST",
    credentials: "include",
  });
}
