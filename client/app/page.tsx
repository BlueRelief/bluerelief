import Link from 'next/link';
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Globe, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp,
  MapPin,
  Brain,
  Clock,
  ArrowRight
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Logo size="default" />
            <span className="text-xl font-bold">BlueRelief</span>
          </div>
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="outline" className="mb-4">
            Next-Gen Crisis Detection
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Real-Time Crisis Detection
            <br />
            Powered by Social Intelligence
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            BlueRelief analyzes millions of social media posts to detect emerging crises and disasters in real-time, 
            empowering first responders and organizations with critical insights when every second counts.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 text">
                <div className="text-center">
                    Get Started
                </div>

                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">95%+</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">&lt;200ms</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Comprehensive Crisis Intelligence</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced AI and real-time data processing deliver actionable insights for faster, more effective crisis response.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>AI-Powered Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced LLM analyzes social media posts to identify emerging crises with 95%+ accuracy and minimal false positives.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Global Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interactive maps powered by Mapbox provide real-time crisis locations and affected areas worldwide.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Real-Time Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Instant notifications and status updates keep first responders informed of developing situations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Crisis Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track sentiment changes and crisis evolution over time with comprehensive data visualization.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Secure Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enterprise-grade security with data encryption and secure authentication for sensitive operations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle>Multi-User Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Role-based access for different user types - from first responders to administrative personnel.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* Technology Stack */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Built with Modern Technology</h2>
          <p className="text-lg text-muted-foreground mb-12">
            Leveraging cutting-edge tools and cloud infrastructure for maximum reliability and performance.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <span className="font-bold text-lg">Next.js</span>
              </div>
              <span className="text-sm text-muted-foreground">Frontend</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <span className="font-bold text-lg">FastAPI</span>
              </div>
              <span className="text-sm text-muted-foreground">Backend</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <span className="font-bold text-lg">Gemini</span>
              </div>
              <span className="text-sm text-muted-foreground">AI/LLM</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <span className="font-bold text-lg">AWS</span>
              </div>
              <span className="text-sm text-muted-foreground">Cloud</span>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Value Proposition */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Save Lives with Faster Crisis Response
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Natural disasters cause over $200 billion in losses annually. BlueRelief helps reduce response time by 
                providing real-time crisis intelligence, potentially saving billions in damages and countless lives.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Faster Detection</h3>
                    <p className="text-muted-foreground">
                      Identify crises as they emerge from social media posts, hours before older, inefficient detection methods.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Data-Driven Insights</h3>
                    <p className="text-muted-foreground">
                      Analyze sentiment trends and crisis evolution to make informed response decisions.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                    <MapPin className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Geographic Precision</h3>
                    <p className="text-muted-foreground">
                      Pinpoint affected areas with interactive maps for targeted response efforts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">Free</div>
                <div className="text-lg mb-6">vs. $30,000+/year competitors</div>
                
                <div className="space-y-4 text-left">
                  <div className="flex justify-between">
                    <span>Real-time monitoring</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI-powered detection</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interactive maps</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Multi-user access</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>24/7 support</span>
                    <span className="text-green-600">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Crisis Response?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join first responders and organizations already using BlueRelief to save lives and reduce disaster impact.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Create an account today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Logo size="sm" />
              <span className="font-bold">BlueRelief</span>
              <span className="text-muted-foreground">© 2025</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Built for first responders, by innovators.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
