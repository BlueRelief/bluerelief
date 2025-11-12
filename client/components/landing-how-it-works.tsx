export function LandingHowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Social Monitoring",
      description: "BlueRelief continuously monitors Bluesky's social firehose in real-time, collecting posts from users worldwide."
    },
    {
      number: "02",
      title: "AI Analysis",
      description: "Gemini AI analyzes each post's sentiment (urgent, fearful, negative, neutral, positive) and extracts crisis information, location, and severity."
    },
    {
      number: "03",
      title: "Crisis Detection",
      description: "Posts indicating disasters are categorized by type (earthquake, flood, fire, etc.) with severity levels from Info to Critical."
    },
    {
      number: "04",
      title: "Smart Alerts",
      description: "Users receive location-based alerts within 100km radius or for custom monitored regions, filtered by their preferences."
    },
    {
      number: "05",
      title: "Population Estimates",
      description: "For each crisis, the system estimates affected population using geographic data and crisis radius."
    },
    {
      number: "06",
      title: "Analytics & Maps",
      description: "Dashboard visualizes trends, patterns, regional breakdowns, and crisis locations on interactive maps."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BlueRelief Works
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            From social posts to actionable intelligence in seconds
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div 
              key={i} 
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative p-8 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
                <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4 opacity-50">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All of this happens automatically, 24/7, ensuring you never miss a critical event in your area or regions of interest.
          </p>
        </div>
      </div>
    </section>
  );
}

