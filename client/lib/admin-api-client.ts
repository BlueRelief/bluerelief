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
    // Silently handle errors - callers will handle the display
    // Re-throw error so callers can handle it gracefully
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
    // Handle 404 (Not Found) errors gracefully - these are expected when endpoints don't exist yet
    if (response.status === 404) {
      throw new Error(`Endpoint not found: ${endpoint}. The backend endpoint may not be implemented yet.`);
    }
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      if (errorText) {
        errorMessage = errorText;
      }
    }
    throw new Error(errorMessage);
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

export interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
  };
  system: {
    total_crises: number;
    urgent_alerts: number;
    recent_crises: number;
    status: string;
    issues: string[];
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  return adminApiGet<AdminStats>('/api/admin/stats');
}

export interface RecentCrisis {
  id: number;
  description: string;
  location_name: string | null;
  severity: string;
  severity_level: number;
  extracted_at: string | null;
  event_time: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function getRecentCrises(limit: number = 10): Promise<{ crises: RecentCrisis[] }> {
  return adminApiGet<{ crises: RecentCrisis[] }>(`/api/admin/recent-crises?limit=${limit}`);
}

export interface RecentUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_admin: boolean;
  created_at: string | null;
  last_login: string | null;
}

export async function getRecentUsers(limit: number = 5): Promise<{ users: RecentUser[] }> {
  return adminApiGet<{ users: RecentUser[] }>(`/api/admin/recent-users?limit=${limit}`);
}

