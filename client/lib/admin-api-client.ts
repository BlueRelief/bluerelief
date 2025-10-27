const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Module-scoped flag to prevent multiple simultaneous redirects
 */
let isRedirecting = false;

/**
 * Get admin JWT token from storage
 */
function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
}

/**
 * Admin API client that automatically includes JWT token in Authorization header
 */
export async function adminApiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const token = getAdminToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    credentials: "include",
    mode: "cors",
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      // Token expired or invalid - only redirect if not already on login page
      if (typeof window !== "undefined" && !isRedirecting) {
        const currentPath = window.location.pathname;
        
        // Skip redirect if already on login page
        if (currentPath === '/admin/login') {
          return response;
        }

        // Prevent multiple simultaneous redirects
        isRedirecting = true;

        // Clear tokens and user info
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        sessionStorage.removeItem('admin_user');
        
        // Perform redirect
        window.location.href = '/admin/login';
      }
    }

    // 403 is different - authorization error, not authentication failure
    // Don't redirect on 403, let the caller handle it

    return response;
  } catch (error) {
    throw error;
  } finally {
    // Reset redirect flag after a delay to allow navigation
    if (isRedirecting && typeof window !== "undefined") {
      setTimeout(() => {
        isRedirecting = false;
      }, 1000);
    }
  }
}

export async function adminApiGet<T>(endpoint: string): Promise<T> {
  const response = await adminApiClient(endpoint, { method: "GET" });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function adminApiPost<T>(endpoint: string, data?: unknown): Promise<T> {
  console.log('token', getAdminToken());
  const response = await adminApiClient(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function adminApiPut<T>(endpoint: string, data?: unknown): Promise<T> {
  const response = await adminApiClient(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function adminApiDelete<T>(endpoint: string): Promise<T> {
  const response = await adminApiClient(endpoint, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

