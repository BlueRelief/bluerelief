"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from 'next/navigation';

export function LandingHero() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="container mx-auto text-center max-w-5xl relative z-10">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/30 bg-background/50 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 mr-2 inline text-primary" />
            Next-Gen Crisis Detection
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Real-Time Crisis Detection
            </span>
            <br />
            <span className="text-foreground">Powered by Social Intelligence</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            BlueRelief monitors Bluesky social media to detect emerging crises in real-time using AI-powered sentiment analysis, 
            delivering location-based alerts to first responders when every second counts.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="text-lg px-10 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            { value: "100km", label: "Alert Radius", gradient: "from-primary to-accent" },
            { value: "5 Levels", label: "Severity Tracking", gradient: "from-accent to-primary" },
            { value: "24/7", label: "Monitoring", gradient: "from-primary to-accent" }
          ].map((stat, i) => (
            <div key={i} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300" />
              <div className="text-center p-4">
                <div className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
    <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}

