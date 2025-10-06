"use client";

import { useState, useEffect } from "react";
import { checkAuthStatus, type User } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await checkAuthStatus(); // Now includes name and picture!
        console.log('Authenticated user:', userData);
        setUser(userData);
      } catch (error) {
        console.error('Auth failed:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

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
    user,        // Now includes name, picture, email, user_id
    loading, 
    isAuthenticated: !!user,
    refreshAuth
  };
}
