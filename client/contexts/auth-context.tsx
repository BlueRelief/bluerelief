"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { checkAuthStatus, type User } from "@/lib/auth";
import { onAuthError } from "@/lib/api-client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await checkAuthStatus();
        console.log('Authenticated user:', userData);
        setUser(userData);
      } catch (error) {
        console.error('Auth failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    // Small delay on initial load to ensure cookies are available
    const timer = setTimeout(() => {
      loadUser();
    }, 50);

    const unsubscribe = onAuthError(() => {
      console.log('Session expired, redirecting to home');
      setUser(null);
      router.push('/');
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [router]);

  const refreshAuth = async () => {
    setLoading(true);
    try {
      const userData = await checkAuthStatus();
      setUser(userData);
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

