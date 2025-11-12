"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkAuthStatus, type User } from "@/lib/auth";
import { onAuthError } from "@/lib/api-client";

export function useAuth() {
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

    loadUser();

    const unsubscribe = onAuthError(() => {
      console.log('Session expired, redirecting to home');
      setUser(null);
      router.push('/');
    });

    return () => {
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

  return { 
    user,
    loading, 
    isAuthenticated: !!user,
    refreshAuth
  };
}
