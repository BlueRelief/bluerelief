"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search,
} from "lucide-react";
import CrisisMap from "@/components/crisis-map";
import { useState, useEffect } from "react";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

const sentimentData = [
  { time: "00:00", sentiment: 65 },
  { time: "04:00", sentiment: 62 },
  { time: "08:00", sentiment: 68 },
  { time: "12:00", sentiment: 72 },
  { time: "16:00", sentiment: 70 },
  { time: "20:00", sentiment: 75 },
];

const chartConfig = {
  sentiment: {
    label: "Sentiment",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const recentEvents = [
  {
    id: 1,
    title: "Flood reports - Downtown Sector 5",
    location: "New York, USA",
    time: "1h ago",
    severity: "Critical",
    severityColor: "bg-red-100 text-red-800"
  },
  {
    id: 2,
    title: "Power outage - Suburb A",
    location: "Los Angeles, USA",
    time: "3h ago",
    severity: "High",
    severityColor: "bg-orange-100 text-orange-800"
  },
  {
    id: 3,
    title: "Road closure - I-40 near exit 12",
    location: "Austin, USA",
    time: "7h ago",
    severity: "Medium",
    severityColor: "bg-yellow-100 text-yellow-800"
  },
  {
    id: 4,
    title: "Protest - City Square",
    location: "London, UK",
    time: "1d ago",
    severity: "Low",
    severityColor: "bg-blue-100 text-blue-800"
  },
];

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("");
  const [regions, setRegions] = useState<Array<{
    region: string;
    incidents: number;
    severity: string;
    coordinates: [number, number];
  }>>([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
        const res = await fetch(`${apiBase}/api/incidents`);
        if (res.ok) {
          const json = await res.json();
          setRegions(json);
        }
      } catch (e) {
        console.warn('Failed to fetch incidents:', e);
      }
    };

    fetchIncidents();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <select className="px-3 py-1.5 text-sm border rounded-md bg-background">
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">200</div>
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
                <div className="text-2xl font-bold">15K</div>
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
                <div className="text-2xl font-bold">12</div>
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
                <div className="text-2xl font-bold">5</div>
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
              <CardTitle className="text-lg">Global Crisis Map</CardTitle>
              <div className="flex gap-2">
                <select className="px-2 py-1 text-xs border rounded-md bg-background">
                  <option>All Locations</option>
                  <option>North America</option>
                  <option>Europe</option>
                  <option>Asia</option>
                </select>
                <select className="px-2 py-1 text-xs border rounded-md bg-background">
                  <option>All Severity</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="h-[400px] rounded-md overflow-hidden border">
              <CrisisMap regions={regions} />
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
                <AreaChart data={sentimentData} accessibilityLayer>
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
                <span>Positive trend</span>
                <span className="text-primary font-medium">+12.5%</span>
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
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <Badge className={`${event.severityColor} text-xs px-2 py-0.5`}>
                  {event.severity}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{event.title}</div>
                  <div className="text-xs text-muted-foreground">{event.location}</div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{event.time}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
