import { apiClient } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  user_id: string;
  user_email: string;
  name?: string;
  picture?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export async function checkAuthStatus(): Promise<User | null> {
  try {
    const response = await apiClient("/auth/status");
    
    if (response.ok) {
      const data = await response.json();
      if (data.authenticated && data.user) {
        return data.user;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function loginWithGoogle() {
  window.location.href = `${API_URL}/auth/google/login`;
}

export function loginWithDemo() {
  window.location.href = `${API_URL}/auth/demo/login`;
}

export function isDemoAuthAvailable(): boolean {
  const isPreview = process.env.NEXT_PUBLIC_IS_PREVIEW === "true";
  return isPreview || process.env.NODE_ENV === "development";
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  window.location.href = "/dashboard";
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  window.location.href = "/dashboard";
}

export async function forgotPassword(email: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to send reset email");
  }

  const data = await response.json();
  return data.message;
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to reset password");
  }

  const data = await response.json();
  return data.message;
}

export async function logout() {
  try {
    const response = await apiClient("/auth/logout");
    
    if (response.ok) {
      window.location.href = "/";
    }
  } catch (error) {
    console.error("Logout failed:", error);
  }
}
