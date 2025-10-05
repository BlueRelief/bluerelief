const API_URL = "http://localhost:8000";

export interface User {
  user_id: string;
  user_email: string;
}

export async function checkAuthStatus(): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/auth/status`, {
      credentials: "include",
      mode: "cors",
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.authenticated && data.user) {
        return data.user;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function loginWithGoogle() {
  window.location.href = `${API_URL}/auth/google/login`;
}

export async function logout() {
  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
      credentials: "include",
      mode: "cors",
    });
    
    if (response.ok) {
      window.location.href = "/login";
    }
  } catch (error) {
    console.error("Logout failed:", error);
  }
}
