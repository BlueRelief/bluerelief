const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let authCallbacks: Array<() => void> = [];

export function onAuthError(callback: () => void) {
  authCallbacks.push(callback);
  return () => {
    authCallbacks = authCallbacks.filter(cb => cb !== callback);
  };
}

function notifyAuthError() {
  authCallbacks.forEach(cb => cb());
}

export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      notifyAuthError();
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await apiClient(endpoint, { method: "GET" });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiPost<T>(endpoint: string, data?: any): Promise<T> {
  const response = await apiClient(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiPut<T>(endpoint: string, data?: any): Promise<T> {
  const response = await apiClient(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await apiClient(endpoint, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}
