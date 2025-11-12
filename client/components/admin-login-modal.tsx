"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lordicon } from "@/components/lordicon";
import { LORDICON_SOURCES, LORDICON_SIZES } from "@/lib/lordicon-config";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AdminLoginModal({ open, onOpenChange }: AdminLoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Store JWT token in localStorage
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
      }
      
      // Store user info
      if (data.user) {
        localStorage.setItem('admin_user', JSON.stringify(data.user));
      }

      onOpenChange(false);
      toast({
        title: "Success",
        description: "Admin login successful!",
      });
      
      window.location.href = "/admin";
    } catch (error: unknown) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
              <Lordicon 
                src={LORDICON_SOURCES.shieldCheck}
                trigger="play-once-then-hover" 
                size={LORDICON_SIZES["2xl"]}
                colorize="currentColor"
              />
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold text-center">
            Admin Access
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in with your administrator credentials
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email Address</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@bluerelief.app"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="pr-10"
                required
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              >
                <Lordicon 
                  src={LORDICON_SOURCES.eye}
                  trigger="hover" 
                  size={LORDICON_SIZES.md}
                  colorize="currentColor"
                />
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Lordicon 
                  src={LORDICON_SOURCES.loader}
                  trigger="loop" 
                  size={LORDICON_SIZES.md}
                  colorize="currentColor"
                />
                <span className="ml-2">Authenticating...</span>
              </>
            ) : (
              <>
                <Lordicon 
                  src={LORDICON_SOURCES.shieldCheck}
                  trigger="hover" 
                  size={LORDICON_SIZES.md}
                  colorize="currentColor"
                />
                <span className="ml-2">Sign In as Admin</span>
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Admin access is restricted to authorized personnel only
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

