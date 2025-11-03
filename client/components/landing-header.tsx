import Link from 'next/link';
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 group">
          <Logo size="default" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            BlueRelief
          </span>
        </Link>
        <Link href="/login">
          <Button variant="outline" className="border-primary/20 hover:border-primary/50 transition-all duration-300">
            Sign In
          </Button>
        </Link>
      </div>
    </header>
  );
}

