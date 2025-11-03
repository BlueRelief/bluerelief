import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LandingCTA() {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary opacity-95" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto max-w-4xl text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          Ready to Transform Crisis Response?
        </h2>
        <p className="text-xl md:text-2xl mb-10 text-white/90 leading-relaxed max-w-2xl mx-auto">
          Start receiving location-based crisis alerts from Bluesky social media today. Monitor your area or regions worldwide.
        </p>
        <Link href="/login">
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-10 py-6 bg-white hover:bg-white/90 text-primary shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

