"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Lordicon } from "@/components/lordicon";
import { Gemini } from "@lobehub/icons";
import { motion } from "motion/react";
import Image from "next/image";

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
      <section className="relative pt-24 pb-12 px-4 overflow-hidden min-h-screen flex flex-col">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="container mx-auto text-center max-w-6xl relative z-10 flex-1 flex flex-col">
          <Badge variant="outline" className="mb-3 px-3 py-1 border-primary/30 bg-background/50 backdrop-blur-sm mx-auto text-xs">
            <span className="inline-flex items-center gap-1.5">
              <Lordicon 
                src="https://cdn.lordicon.com/juujmrhr.json" 
                trigger="loop" 
                size={14} 
                colorize="currentColor"
              />
              <span>Next-Gen Crisis Detection</span>
              <span className="text-muted-foreground">•</span>
              <span className="inline-flex items-center gap-1">
                <span>Powered by</span>
                <Gemini size={14} className="inline-block" />
                <span>Gemini AI</span>
              </span>
            </span>
          </Badge>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Real-Time Crisis Detection
            </span>
            <br />
            <span className="text-foreground">Powered by Social Intelligence</span>
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground mb-5 max-w-2xl mx-auto leading-relaxed">
            AI-powered monitoring of Bluesky social media to detect emerging crises and deliver location-based alerts to first responders in real-time.
          </p>
          
          <div className="mb-6">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="text-base px-8 py-5 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

        {/* Animated Dashboard Preview */}
        <div className="flex-1 flex items-center justify-center mt-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl mx-auto px-4"
            style={{ perspective: "1500px" }}
          >
            <motion.div
              initial={{ rotateX: 30, rotateY: -15 }}
              animate={{ 
                rotateX: 18,
                rotateY: -8,
                scale: 1
              }}
              whileHover={{
                rotateX: 15,
                rotateY: -5,
                scale: 1.02,
                transition: { duration: 0.4 }
              }}
              transition={{ 
                duration: 1.2,
                delay: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="relative"
              style={{ 
                transformStyle: "preserve-3d",
                transformOrigin: "center center"
              }}
            >
              {/* Large glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-3xl blur-3xl opacity-40" />
              
              {/* Medium glow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/40 via-accent/40 to-primary/40 rounded-2xl blur-2xl opacity-60" />
              
              {/* Dashboard image container with enhanced 3D effect */}
              <div className="relative rounded-2xl overflow-hidden border border-primary/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] bg-background/80 backdrop-blur-sm">
                {/* Top shine effect */}
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10" />
                
                <Image
                  src="/app-dashboard.png"
                  alt="BlueRelief Dashboard Preview"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  priority
                />
                
                {/* Bottom fade gradient */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />
                
                {/* Subtle inner shadow */}
                <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] rounded-2xl pointer-events-none" />
              </div>

              {/* 3D depth shadow */}
              <div 
                className="absolute inset-0 bg-background/60 rounded-2xl -z-10"
                style={{
                  transform: "translateZ(-50px)",
                  filter: "blur(20px)"
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
    <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}

