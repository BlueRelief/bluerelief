"use client";

import { useState, useEffect } from "react";
import { checkAuthStatus, type User } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const userData = await checkAuthStatus();
      setUser(userData);
      setLoading(false);
    }

    loadUser();
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
