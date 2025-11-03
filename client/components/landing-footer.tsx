import { Logo } from "@/components/logo";

export function LandingFooter() {
  return (
    <footer className="py-12 px-4 border-t bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <Logo size="sm" />
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BlueRelief
            </span>
            <span className="text-muted-foreground">© 2025</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Built for first responders, by innovators.
          </div>
        </div>
      </div>
    </footer>
  );
}

