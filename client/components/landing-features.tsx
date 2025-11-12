import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lordicon } from "@/components/lordicon";

const features = [
  {
    iconSrc: "https://cdn.lordicon.com/ohcvbvqh.json",
    title: "AI Sentiment Analysis",
    description: "Gemini-powered AI analyzes Bluesky posts in real-time, categorizing sentiment as urgent, fearful, negative, neutral, or positive to identify emerging crises.",
    gradient: "from-primary/10 to-accent/10"
  },
  {
    iconSrc: "https://cdn.lordicon.com/zosctjws.json",
    title: "Location-Based Alerts",
    description: "Receive alerts for crises within 100km of your location, or monitor specific regions globally with custom preferences.",
    gradient: "from-accent/10 to-primary/10"
  },
  {
    iconSrc: "https://cdn.lordicon.com/ahxaipjb.json",
    title: "Real-Time Notifications",
    description: "Get instant alerts for new crises, severity changes, and updates via platform and email notifications based on your preferences.",
    gradient: "from-primary/10 to-accent/10"
  },
  {
    iconSrc: "https://cdn.lordicon.com/vihyezfv.json",
    title: "5-Level Severity System",
    description: "Track disasters by severity from Info to Critical with population impact estimates and time-series analysis for each event.",
    gradient: "from-accent/10 to-primary/10"
  },
  {
    iconSrc: "https://cdn.lordicon.com/zosctjws.json",
    title: "Interactive Maps",
    description: "Visualize crisis locations on Mapbox-powered maps with regional breakdowns and affected area visualization.",
    gradient: "from-primary/10 to-accent/10"
  },
  {
    iconSrc: "https://cdn.lordicon.com/kphwxuxr.json",
    title: "Custom Alert Preferences",
    description: "Personalize your experience with custom regions, disaster types, severity thresholds, and notification preferences.",
    gradient: "from-accent/10 to-primary/10"
  }
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Comprehensive{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Crisis Intelligence
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Bluesky social monitoring with Gemini AI delivers location-aware alerts and real-time insights for faster crisis response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <Card 
              key={i} 
              className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardHeader className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-md text-primary-foreground">
                  <Lordicon 
                    src={feature.iconSrc} 
                    trigger="hover" 
                    size={28} 
                    colorize="currentColor"
                  />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

