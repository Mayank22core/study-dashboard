const BASE = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    throw new Error("Unauthorized");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function login(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("token", data.token);
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  window.location.reload();
}

export async function getTasks() {
  return request("/tasks");
}

export async function createTask(title, subject, deadline) {
  return request("/tasks", {
    method: "POST",
    body: JSON.stringify({ title, subject, deadline }),
  });
}

export async function updateTask(id, updates) {
  return request(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteTask(id) {
  return request(`/tasks/${id}`, { method: "DELETE" });
}

export async function saveSession(duration) {
  return request("/sessions", {
    method: "POST",
    body: JSON.stringify({ duration }),
  });
}

export async function getStats() {
  return request("/stats");
}
