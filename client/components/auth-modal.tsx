"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lordicon } from "@/components/lordicon";
import { LORDICON_SOURCES, LORDICON_SIZES } from "@/lib/lordicon-config";
import { loginWithGoogle, loginWithDemo, isDemoAuthAvailable, loginWithEmail, registerWithEmail, forgotPassword } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const { toast } = useToast();
  const showDemoAuth = isDemoAuthAvailable();

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await loginWithEmail(loginForm.email, loginForm.password);
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (signupForm.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await registerWithEmail(signupForm.name, signupForm.email, signupForm.password);
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
    } catch (error: unknown) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    loginWithGoogle();
  };

  const handleDemoAuth = () => {
    setIsDemoLoading(true);
    loginWithDemo();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    
    try {
      const message = await forgotPassword(forgotEmail);
      toast({
        title: "Email Sent",
        description: message,
      });
      setShowForgotPasswordModal(false);
      setForgotEmail("");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center">
            Welcome to BlueRelief
          </DialogTitle>
          <DialogDescription className="text-center">
            Access free crisis detection and monitoring services
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285f4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34a853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#ea4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {showDemoAuth && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleDemoAuth}
                disabled={isDemoLoading}
              >
                {isDemoLoading ? (
                  <>
                    <Lordicon 
                      src={LORDICON_SOURCES.loader}
                      trigger="loop" 
                      size={LORDICON_SIZES.md}
                      colorize="currentColor"
                    />
                    <span className="ml-2">Loading demo...</span>
                  </>
                ) : (
                  <>
                    <span className="mr-2">🧪</span>
                    Demo Login (Preview Only)
                  </>
                )}
              </Button>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="pr-10"
                    required
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
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm h-auto"
                    onClick={() => {
                      onOpenChange(false);
                      setShowForgotPasswordModal(true);
                    }}
                  >
                    Forgot password?
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
                    <span className="ml-2">Signing in...</span>
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285f4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34a853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#ea4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or create account with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="pr-10"
                    required
                    minLength={8}
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
                <p className="text-xs text-muted-foreground">
                  At least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    <span className="ml-2">Creating account...</span>
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* Forgot Password Modal */}
    <Dialog open={showForgotPasswordModal} onOpenChange={setShowForgotPasswordModal}>
      <DialogContent className="sm:max-w-md bg-card border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Reset Password</DialogTitle>
          <DialogDescription>
            Enter your email to receive a password reset link
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="your.email@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isForgotLoading}>
            {isForgotLoading ? (
              <>
                <Lordicon 
                  src={LORDICON_SOURCES.loader}
                  trigger="loop" 
                  size={LORDICON_SIZES.md}
                  colorize="currentColor"
                />
                <span className="ml-2">Sending...</span>
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}

