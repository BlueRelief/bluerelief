"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Loader2, Shield, AlertCircle } from "lucide-react";

interface LoginError {
  message: string;
  type: 'credentials' | 'permission' | 'domain' | 'locked' | 'unknown';
}

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if admin token already exists in either storage
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (token) {
      router.push('/admin');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token
        const token = data.token;
        if (rememberMe) {
          localStorage.setItem('admin_token', token);
        } else {
          sessionStorage.setItem('admin_token', token);
        }

        // Store user info in same storage as token
        const userInfo = data.user;
        if (rememberMe) {
          localStorage.setItem('admin_user', JSON.stringify(userInfo));
        } else {
          sessionStorage.setItem('admin_user', JSON.stringify(userInfo));
        }

        // Redirect to admin dashboard
        router.push('/admin');
      } else {
        // Handle different error types
        let errorMessage = 'An error occurred. Please try again.';
        let errorType: LoginError['type'] = 'unknown';

        switch (response.status) {
          case 401:
            errorMessage = 'Invalid credentials. Please check your email and password.';
            errorType = 'credentials';
            break;
          case 403:
            if (data.detail?.includes('domain')) {
              errorMessage = data.detail;
              errorType = 'domain';
            } else {
              errorMessage = 'Access denied. You do not have administrator privileges.';
              errorType = 'permission';
            }
            break;
          case 423:
            errorMessage = 'Account is locked due to multiple failed login attempts. Please contact support.';
            errorType = 'locked';
            break;
          default:
            errorMessage = data.detail || errorMessage;
            break;
        }

        setError({ message: errorMessage, type: errorType });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError({
        message: 'Network error. Please check your connection and try again.',
        type: 'unknown',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Admin gradient background using CSS variables from globals.css */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-secondary to-muted"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-background/30 to-muted/40 dark:via-secondary/40"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-muted/50 dark:to-secondary/30"></div>
      
      {/* Additional gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-muted/30 dark:to-background/50"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="relative">
            <Logo size="xl" />
            <Badge 
              variant="default" 
              className="absolute -top-2 -right-2 bg-primary shadow-lg border-2 border-foreground"
            >
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          </div>
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Administrator Portal - Secure Access Required
          </p>
        </div>
        
        <Card className="w-full shadow-2xl border-2 bg-card/95 dark:bg-card/95 backdrop-blur-md animate-slide-up">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-semibold">
              Administrator Login
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                  required
                  disabled={isLoggingIn}
                />
                <p className="text-xs text-muted-foreground">
                  Must be from an authorized domain
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 bg-background"
                    required
                    disabled={isLoggingIn}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoggingIn}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked: boolean | "indeterminate") => setRememberMe(checked === true)}
                  disabled={isLoggingIn}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me for 7 days
                </Label>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error.message}</span>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Forgot your password? Contact system administrator.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>Secure connection</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

