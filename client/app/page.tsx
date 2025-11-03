import { LandingHeader } from "@/components/landing-header";
import { LandingHero } from "@/components/landing-hero";
import { LandingFeatures } from "@/components/landing-features";
import { LandingHowItWorks } from "@/components/landing-how-it-works";
import { LandingValueProp } from "@/components/landing-value-prop";
import { LandingCTA } from "@/components/landing-cta";
import { LandingFooter } from "@/components/landing-footer";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <LandingHero />
      <Separator />
      <LandingFeatures />
      <Separator />
      <LandingHowItWorks />
      <Separator />
      <LandingValueProp />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
