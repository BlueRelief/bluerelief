"use client"

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/hooks/use-auth";
import { Mail, Github, Twitter } from "lucide-react";

export function LandingFooter() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else if (href.startsWith('/dashboard') || href.startsWith('/admin')) {
      if (!isAuthenticated) {
        e.preventDefault();
        setShowAuthModal(true);
      }
    }
  };

  const footerLinks = {
    product: [
      { href: "#features", label: "Features" },
      { href: "#how-it-works", label: "How It Works" },
      { href: "#about", label: "About" },
      { href: "/dashboard", label: "Dashboard" },
    ],
    platform: [
      { href: "/dashboard/alerts", label: "Alerts" },
      { href: "/dashboard/analysis", label: "Analysis" },
      { href: "/dashboard/data-feed", label: "Data Feed" },
      { href: "/dashboard/settings", label: "Settings" },
    ],
    admin: [
      { href: "/admin/login", label: "Admin Login" },
      { href: "/admin/users", label: "User Management" },
      { href: "/admin/logs", label: "System Logs" },
    ],
    resources: [
      { href: "https://github.com/bluerelief", label: "GitHub" },
      { href: "mailto:admin@bluerelief.app", label: "Contact" },
      { href: "https://platform.private.bluerelief.app/docs", label: "Documentation" },
      { href: "https://platform.private.bluerelief.app/api/docs", label: "API" },
    ],
  };

  return (
    <footer className="py-16 px-4 border-t bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Logo size="default" />
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                BlueRelief
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-sm leading-relaxed">
              Real-time crisis monitoring and management platform. Powered by Bluesky social monitoring and Gemini AI.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/bluerelief" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-border hover:border-primary/50 flex items-center justify-center transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com/bluerelief" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-border hover:border-primary/50 flex items-center justify-center transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="mailto:admin@bluerelief.app"
                className="w-10 h-10 rounded-full border border-border hover:border-primary/50 flex items-center justify-center transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('http') || link.href.startsWith('mailto') ? (
                    <a 
                      href={link.href}
                      target={link.href.startsWith('http') ? "_blank" : undefined}
                      rel={link.href.startsWith('http') ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2025 BlueRelief. Built for first responders, by innovators.
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </footer>
  );
}

