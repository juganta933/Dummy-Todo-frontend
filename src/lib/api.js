const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Universal API Client with JWT Bearer handling
 */
export async function fetchWithAuth(endpoint, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: "omit",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => fetchWithAuth("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => fetchWithAuth("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  getMe: () => fetchWithAuth("/auth/me", { method: "GET" }),
  
  // Todos
  getTodos: (query = "") => fetchWithAuth(`/todos${query ? `?${query}` : ""}`, { method: "GET" }),
  createTodo: (body) => fetchWithAuth("/todos", { method: "POST", body: JSON.stringify(body) }),
  updateTodo: (id, body) => fetchWithAuth(`/todos/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  toggleTodo: (id) => fetchWithAuth(`/todos/${id}/toggle`, { method: "PATCH" }),
  deleteTodo: (id) => fetchWithAuth(`/todos/${id}`, { method: "DELETE" }),
  clearCompleted: () => fetchWithAuth("/todos/completed/clear", { method: "DELETE" }),
};
