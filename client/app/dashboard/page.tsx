"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search,
} from "lucide-react";
import CrisisMap from "@/components/crisis-map";
import { useState, useEffect, useMemo } from "react";
import { 
  ChartContainer,
  type ChartConfig 
} from "@/components/ui/chart";
import { AreaChart, Area } from "recharts";
import { apiGet } from "@/lib/api-client";

const chartConfig = {
  sentiment: {
    label: "Sentiment",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface DashboardStats {
  total_crises: number;
  affected_people: number;
  urgent_alerts: number;
  active_regions: number;
}

interface SentimentTrend {
  time: string;
  sentiment: number | null;
}

interface RecentEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  time: string;
  severity: string;
  severityColor: string;
  bluesky_url?: string;
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [regions, setRegions] = useState<Array<{
    region: string;
    incidents: number;
    severity: string;
    coordinates: [number, number];
    crisis_description?: string;
  }>>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_crises: 0,
    affected_people: 0,
    urgent_alerts: 0,
    active_regions: 0,
  });
  const [sentimentData, setSentimentData] = useState<SentimentTrend[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const [statsData, sentimentResponse, eventsResponse, incidentsData] = await Promise.all([
          apiGet<DashboardStats>('/api/dashboard/stats'),
          apiGet<{ trends: SentimentTrend[] }>('/api/dashboard/sentiment-trends'),
          apiGet<{ events: RecentEvent[] }>('/api/dashboard/recent-events'),
          apiGet<Array<{
            region: string;
            incidents: number;
            severity: string;
            coordinates: [number, number];
            crisis_description?: string;
          }>>('/api/incidents'),
        ]);

        setStats(statsData);
        setSentimentData(sentimentResponse.trends);
        setRecentEvents(eventsResponse.events);
        setRegions(incidentsData);
      } catch (e) {
        console.warn('Failed to fetch dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getRegionFromCoordinates = (lng: number, lat: number): string => {
    // North America: roughly -170 to -50 longitude, 15 to 72 latitude
    if (lng >= -170 && lng <= -50 && lat >= 15 && lat <= 72) return "north-america";
    
    // South America: roughly -82 to -34 longitude, -56 to 13 latitude
    if (lng >= -82 && lng <= -34 && lat >= -56 && lat <= 13) return "south-america";
    
    // Europe: roughly -10 to 40 longitude, 36 to 71 latitude
    if (lng >= -10 && lng <= 40 && lat >= 36 && lat <= 71) return "europe";
    
    // Africa: roughly -18 to 52 longitude, -35 to 37 latitude
    if (lng >= -18 && lng <= 52 && lat >= -35 && lat <= 37) return "africa";
    
    // Middle East: roughly 34 to 63 longitude, 12 to 42 latitude
    if (lng >= 34 && lng <= 63 && lat >= 12 && lat <= 42) return "middle-east";
    
    // Oceania: roughly 110 to 180 longitude, -50 to 0 latitude (includes Australia, NZ)
    if (lng >= 110 && lng <= 180 && lat >= -50 && lat <= 0) return "oceania";
    
    // Asia: roughly 40 to 150 longitude, 0 to 55 latitude
    if (lng >= 40 && lng <= 150 && lat >= 0 && lat <= 55) return "asia";
    
    return "all";
  };

  const filteredRegions = useMemo(() => {
    return regions.filter(region => {
      const severityMatch = severityFilter === "all" || region.severity.toLowerCase() === severityFilter.toLowerCase();
      
      let locationMatch = true;
      if (locationFilter !== "all") {
        const regionName = region.region.toLowerCase();
        const [lng, lat] = region.coordinates;
        const coordRegion = getRegionFromCoordinates(lng, lat);
        
        // Match by both name keywords AND coordinates
        const nameMatch = (() => {
          switch (locationFilter) {
            case "north-america":
              return regionName.includes("usa") || regionName.includes("united states") || 
                     regionName.includes("canada") || regionName.includes("mexico") || 
                     regionName.includes("america");
            case "south-america":
              return regionName.includes("brazil") || regionName.includes("argentina") || 
                     regionName.includes("colombia") || regionName.includes("peru") || 
                     regionName.includes("chile") || regionName.includes("venezuela");
            case "europe":
              return regionName.includes("uk") || regionName.includes("france") || 
                     regionName.includes("germany") || regionName.includes("spain") || 
                     regionName.includes("italy") || regionName.includes("poland") || 
                     regionName.includes("ukraine") || regionName.includes("europe");
            case "africa":
              return regionName.includes("egypt") || regionName.includes("south africa") || 
                     regionName.includes("nigeria") || regionName.includes("kenya") || 
                     regionName.includes("morocco") || regionName.includes("ethiopia") || 
                     regionName.includes("africa");
            case "asia":
              return regionName.includes("japan") || regionName.includes("china") || 
                     regionName.includes("india") || regionName.includes("bangladesh") || 
                     regionName.includes("nepal") || regionName.includes("indonesia") || 
                     regionName.includes("philippines") || regionName.includes("pakistan") || 
                     regionName.includes("thailand") || regionName.includes("vietnam") || 
                     regionName.includes("korea") || regionName.includes("asia");
            case "oceania":
              return regionName.includes("australia") || regionName.includes("new zealand") || 
                     regionName.includes("fiji") || regionName.includes("papua");
            case "middle-east":
              return regionName.includes("saudi") || regionName.includes("uae") || 
                     regionName.includes("iran") || regionName.includes("iraq") || 
                     regionName.includes("israel") || regionName.includes("yemen") || 
                     regionName.includes("syria") || regionName.includes("jordan");
            default:
              return false;
          }
        })();
        
        locationMatch = nameMatch || coordRegion === locationFilter;
      }
      
      return severityMatch && locationMatch;
    });
  }, [regions, severityFilter, locationFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select value={timeRange || "24h"} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Last 24 hours" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {loading ? "-" : stats.total_crises.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total Crises</div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="text-primary text-xl">🌊</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {loading ? "-" : stats.affected_people.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Affected People</div>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <div className="text-destructive text-xl">👥</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {loading ? "-" : stats.urgent_alerts.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Urgent Alerts</div>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <div className="text-amber-500 text-xl">⚠️</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {loading ? "-" : stats.active_regions.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Active Regions</div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <div className="text-green-500 text-xl">🌍</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Global Crisis Heatmap</CardTitle>
              <div className="flex gap-2">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[140px] h-7 text-xs">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="north-america">North America</SelectItem>
                    <SelectItem value="south-america">South America</SelectItem>
                    <SelectItem value="europe">Europe</SelectItem>
                    <SelectItem value="africa">Africa</SelectItem>
                    <SelectItem value="asia">Asia</SelectItem>
                    <SelectItem value="oceania">Oceania</SelectItem>
                    <SelectItem value="middle-east">Middle East</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[120px] h-7 text-xs">
                    <SelectValue placeholder="All Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="h-[400px] rounded-md overflow-hidden border">
              <CrisisMap regions={filteredRegions} focusRegion={locationFilter} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sentiment Trends</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <ChartContainer config={chartConfig} className="h-[120px] w-full">
                <AreaChart 
                  data={sentimentData.map(d => ({
                    time: new Date(d.time).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }),
                    sentiment: d.sentiment ?? 0
                  }))} 
                  accessibilityLayer
                >
                  <defs>
                    <linearGradient id="fillSentiment" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-sentiment)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-sentiment)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="sentiment" 
                    stroke="var(--color-sentiment)" 
                    fill="url(#fillSentiment)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {loading ? "Loading..." : sentimentData.length > 0 ? "Recent trend" : "No data"}
                </span>
                <span className="text-primary font-medium">
                  {sentimentData.length > 0 && sentimentData[0].sentiment !== null && sentimentData[sentimentData.length - 1].sentiment !== null 
                    ? `${((sentimentData[sentimentData.length - 1].sentiment! - sentimentData[0].sentiment!) / sentimentData[0].sentiment! * 100).toFixed(1)}%`
                    : "-"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Monitors</span>
                  <span className="text-sm font-medium">24/7</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data Sources</span>
                  <span className="text-sm font-medium">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Response</span>
                  <span className="text-sm font-medium">8.5 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">System Status</span>
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                    Operational
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Events</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-8 h-8 w-[180px] text-sm"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Loading events...
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent events found
              </div>
            ) : (
              recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Badge className={`${event.severityColor} text-xs px-2 py-0.5 mt-0.5`}>
                      {event.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs text-muted-foreground mb-1">{event.location}</div>
                      <div className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">
                        {event.description}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{event.time}</div>
                  </div>
                  {event.bluesky_url && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(event.bluesky_url, '_blank')}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.593-.218 1.267-.218 2.018 0 .751.08 1.425.218 2.018-.14-.017-.279-.036-.415-.056-2.67-.296-5.568.628-6.383 3.364C.378 21.729 0 26.689 0 27.377c0 .688.139 1.86.902 2.203.659.299 1.664.621 4.3-1.24C7.954 26.397 10.913 22.458 12 20.344c1.087 2.114 4.046 6.053 6.798 7.995 2.636 1.861 3.641 1.539 4.3 1.24.763-.343.902-1.515.902-2.203 0-.688-.378-5.648-.624-6.477-.815-2.736-3.713-3.66-6.383-3.364-.136.02-.275.039-.415.056.138-.593.218-1.267.218-2.018 0-.751-.08-1.425-.218-2.018.14.017.279.036.415.056 2.67.296 5.568-.628 6.383-3.364.246-.829.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8z"/>
                        </svg>
                        View on Bluesky
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
