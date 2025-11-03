import { Clock, TrendingUp, MapPin, CheckCircle2 } from "lucide-react";

export function LandingValueProp() {
  const benefits = [
    {
      icon: Clock,
      title: "Real-Time Detection",
      description: "Monitor Bluesky's social firehose to identify crises as they emerge, with automated sentiment analysis detecting urgent posts instantly."
    },
    {
      icon: TrendingUp,
      title: "Pattern Recognition",
      description: "Track recurring patterns, disaster types, and regional trends with AI-powered analytics and time-series visualization."
    },
    {
      icon: MapPin,
      title: "Geo-Aware Alerts",
      description: "Get location-based notifications within 100km radius or monitor custom regions worldwide with population impact estimates."
    }
  ];

  const features = [
    "Bluesky social monitoring",
    "Gemini AI sentiment analysis",
    "Location-based alerts (100km)",
    "Email notifications",
    "Interactive crisis maps",
    "Population impact estimates",
    "Custom alert preferences",
    "Historical data & trends"
  ];

  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Save Lives with{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Faster Crisis Response
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Traditional crisis detection relies on delayed official reports. BlueRelief monitors social media in real-time, 
              detecting crises as they unfold through on-the-ground posts, enabling faster response when minutes matter.
            </p>
            
            <div className="space-y-8">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mt-1 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
            <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-transparent backdrop-blur-sm rounded-3xl p-10 border border-primary/20 shadow-2xl">
              <div className="text-center mb-8">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  Open Platform
                </div>
                <div className="text-lg text-muted-foreground">All features included</div>
              </div>
              
              <div className="space-y-4">
                {features.map((feature, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group"
                  >
                    <span className="font-medium">{feature}</span>
                    <CheckCircle2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

