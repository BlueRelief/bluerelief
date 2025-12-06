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
import { Combobox } from "@/components/ui/combobox";
import {
  Search,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SentimentBadge } from "@/components/sentiment-badge";
import { BlueskyIcon } from "@/components/bluesky-icon";
import { Lordicon } from "@/components/lordicon";
import { LORDICON_SOURCES, LORDICON_SIZES } from "@/lib/lordicon-config";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useState, useEffect, useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { apiGet } from "@/lib/api-client";
import { useAlertNotifications } from "@/hooks/use-alert-notifications";
import { useAuth } from "@/hooks/use-auth";
import { formatActivityTime } from "@/lib/utils";
import dynamic from "next/dynamic";

const CrisisMap = dynamic(() => import("@/components/crisis-map"), {
  loading: () => (
    <div className="h-[500px] flex items-center justify-center">
      <LoadingSpinner size={48} text="Loading map..." />
    </div>
  ),
  ssr: false,
});

const chartConfig = {
  sentiment: {
    label: "Sentiment Score",
    color: "oklch(0.6368 0.2078 25.3313)",
  },
} satisfies ChartConfig;

const timeSeriesChartConfig = {
  incident_count: {
    label: "Incident Count",
    color: "oklch(0.6368 0.2078 25.3313)",
  },
  avg_severity: {
    label: "Avg Severity",
    color: "oklch(0.5593 0.1942 258.4556)",
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
  event_time?: string | null;
  severity: string;
  severityColor: string;
  bluesky_url?: string;
  sentiment?: string | null;
  sentiment_score?: number | null;
}

interface TimeSeriesData {
  timestamp: string;
  incident_count: number;
  avg_severity: number;
}

interface DisasterTypesData {
  disaster_types: Record<string, number>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("");
  const [disasterTypeFilters, setDisasterTypeFilters] = useState<string[]>([]);
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
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [disasterTypes, setDisasterTypes] = useState<Array<{name: string; count: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllEvents, _setShowAllEvents] = useState(false);

  // Enable real-time alert notifications and get user-specific alerts
  const { alerts: userAlerts } = useAlertNotifications({
    userId: user?.user_id ? parseInt(user.user_id, 10) : undefined,
    enabled: !!user?.user_id
  });

  // Count urgent alerts relevant to the user (Level 4-5)
  const userUrgentAlerts = useMemo(() => {
    return userAlerts?.filter(alert => alert.severity >= 4) || [];
  }, [userAlerts]);

  useEffect(() => {
    let cancelled = false;
    const fetchDashboardData = async () => {
      try {
        setIsRefreshing(true);
        setLoading(true);

        const timeParam = timeRange || '24h';
        const timeHoursMap: Record<string, number> = { '6h': 6, '12h': 12, '24h': 24, '48h': 48, '7d': 168, '30d': 720 };
        const timeSeriesHours = timeHoursMap[timeParam] || 48;
        const [statsData, sentimentResponse, eventsResponse, incidentsData, timeSeriesResponse, disasterTypesResponse] = await Promise.all([
          apiGet<DashboardStats>(`/api/dashboard/stats?time_range=${timeParam}`),
          apiGet<{ trends: SentimentTrend[] }>(`/api/dashboard/sentiment-trends?time_range=${timeParam}`),
          apiGet<{ events: RecentEvent[] }>(`/api/dashboard/recent-events?time_range=${timeParam}`),
          apiGet<Array<{
            region: string;
            incidents: number;
            severity: string;
            coordinates: [number, number];
            crisis_description?: string;
          }>>(`/api/incidents?time_range=${timeParam}`),
          apiGet<{ timeseries: TimeSeriesData[] }>(`/api/dashboard/time-series?hours=${timeSeriesHours}`),
          apiGet<DisasterTypesData>(`/api/dashboard/disaster-types?time_range=${timeParam}`),
        ]);

        if (cancelled) return;

        setStats(statsData);
        setSentimentData(sentimentResponse.trends);
        setRecentEvents(eventsResponse.events);
        setRegions(incidentsData);
        setTimeSeriesData(timeSeriesResponse.timeseries);
        
        // Transform disaster types into array format
        const disasterTypesArray = Object.entries(disasterTypesResponse.disaster_types).map(([name, count]) => ({
          name,
          count
        })).sort((a, b) => b.count - a.count);
        setDisasterTypes(disasterTypesArray);
        
        setLastFetch(new Date());
      } catch (e) {
        console.warn('Failed to fetch dashboard data:', e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    fetchDashboardData();

    return () => { cancelled = true; };
  }, [timeRange]);

  // update `now` every 60s so "X minutes ago" UI updates automatically
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
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
      
      // Country filter
      const countryMatch = !countryFilter || region.region.toLowerCase().includes(countryFilter.toLowerCase());

      // Disaster type filter
      const disasterTypeMatch = disasterTypeFilters.length === 0 || 
        disasterTypeFilters.some(type => 
          region.crisis_description?.toLowerCase().includes(type.toLowerCase())
        );
      
      return severityMatch && locationMatch && countryMatch && disasterTypeMatch;
    });
  }, [regions, severityFilter, locationFilter, countryFilter, disasterTypeFilters]);

  const displayedEvents = useMemo(() => {
    const filtered = searchQuery 
      ? recentEvents.filter(event => 
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : recentEvents;
    
    return showAllEvents ? filtered : filtered.slice(0, 5);
  }, [recentEvents, searchQuery, showAllEvents]);

  const formatTimeRangeLabel = (val: string) => {
    switch (val) {
      case '6h': return 'Last 6 Hours';
      case '12h': return 'Last 12 Hours';
      case '24h': return 'Last 24 Hours (Current Events)';
      case '48h': return 'Last 48 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      default: return 'Last 24 Hours (Current Events)';
    }
  };

  const lastUpdatedText = () => {
    if (!lastFetch) return 'Never updated';
    const diffMs = now.getTime() - lastFetch.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name?.split(' ')[0] || "there";

  const hasActiveMapFilters = countryFilter !== "" || disasterTypeFilters.length > 0;

  const availableCountries = useMemo(() => {
    const countries = [...new Set(regions.map(r => r.region))].sort();
    return countries;
  }, [regions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{getGreeting()}, {firstName}! 👋</p>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">
              {formatTimeRangeLabel(timeRange || '24h')}
            </span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              Updated {lastUpdatedText()}
            </span>
            {isRefreshing && (
              <>
                <span className="text-sm text-muted-foreground">•</span>
                <div className="h-3 w-3 rounded-full border-2 border-primary/25 border-t-primary animate-spin" aria-hidden />
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick Actions - Icon Only */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard/map">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Lordicon 
                      src={LORDICON_SOURCES.globe}
                      trigger="hover"
                      size={LORDICON_SIZES.md}
                      colorize="currentColor"
                    />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Full Map</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard/data-feed">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Lordicon 
                      src={LORDICON_SOURCES.dataFeed}
                      trigger="hover"
                      size={LORDICON_SIZES.md}
                      colorize="currentColor"
                    />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>All Events</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard/alerts">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Lordicon 
                      src={LORDICON_SOURCES.bell}
                      trigger="hover"
                      size={LORDICON_SIZES.md}
                      colorize="currentColor"
                    />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Alerts</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard/settings">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Lordicon 
                      src={LORDICON_SOURCES.location}
                      trigger="hover"
                      size={LORDICON_SIZES.md}
                      colorize="currentColor"
                    />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-6 w-px bg-border"></div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Lordicon 
                src={LORDICON_SOURCES.info}
                trigger="hover" 
                size={LORDICON_SIZES.md}
                colorize="currentColor"
              />
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px]">
              <p>Filter all dashboard data by time range. Changes affect metrics, map markers, and event lists.</p>
            </TooltipContent>
          </Tooltip>
          <Select value={timeRange || "24h"} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Last 24 Hours (Current Events)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="12h">Last 12 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours (Current Events)</SelectItem>
              <SelectItem value="48h">Last 48 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Urgent Alert Banner - Only shows user-relevant alerts */}
      {userUrgentAlerts.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lordicon
                  src={LORDICON_SOURCES.alert}
                  trigger="loop"
                  size={24}
                  colorize="var(--destructive)"
                />
              </div>
              <div>
                <div className="font-semibold">
                  {userUrgentAlerts.length} Urgent Alert{userUrgentAlerts.length !== 1 ? 's' : ''} for Your Region
                </div>
                <div className="text-sm text-muted-foreground">
                  High-severity crises in your monitored areas
                </div>
              </div>
            </div>
            <Link href="/dashboard/alerts">
              <Button variant="destructive" size="sm">
                View Alerts
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics - Inline Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Lordicon
                  src={LORDICON_SOURCES.globe}
                  trigger="play-once-then-hover"
                  size={24}
                  colorize="rgb(59, 130, 246)"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                <div className="text-2xl font-bold">
                  {loading ? "-" : stats.total_crises.toLocaleString()}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <Lordicon 
                          src={LORDICON_SOURCES.info}
                          trigger="hover" 
                          size={14}
                          colorize="rgb(156, 163, 175)"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of active crisis events detected in the selected time range</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-xs text-muted-foreground">Total Crises</div>
            </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Lordicon
                  src={LORDICON_SOURCES.people}
                  trigger="play-once-then-hover"
                  size={24}
                  colorize="rgb(239, 68, 68)"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                <div className="text-2xl font-bold">
                  {loading ? "-" : stats.affected_people.toLocaleString()}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <Lordicon 
                          src={LORDICON_SOURCES.info}
                          trigger="hover" 
                          size={14}
                          colorize="rgb(156, 163, 175)"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Estimated total population affected by active crisis events</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-xs text-muted-foreground">Affected People</div>
            </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Lordicon
                  src={LORDICON_SOURCES.alert}
                  trigger="play-once-then-hover"
                  size={24}
                  colorize="rgb(245, 158, 11)"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                <div className="text-2xl font-bold">
                  {loading ? "-" : stats.urgent_alerts.toLocaleString()}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <Lordicon 
                          src={LORDICON_SOURCES.info}
                          trigger="hover" 
                          size={14}
                          colorize="rgb(156, 163, 175)"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of posts with urgent sentiment requiring immediate attention</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-xs text-muted-foreground">Urgent Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Lordicon
                  src={LORDICON_SOURCES.location}
                  trigger="play-once-then-hover"
                  size={24}
                  colorize="rgb(34, 197, 94)"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="text-2xl font-bold">
                    {loading ? "-" : stats.active_regions.toLocaleString()}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <Lordicon 
                          src={LORDICON_SOURCES.info}
                          trigger="hover" 
                          size={14}
                          colorize="rgb(156, 163, 175)"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of distinct geographic regions with active crisis events</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-xs text-muted-foreground">Active Regions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map + Sidebar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Crisis Map */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lordicon 
                  src={LORDICON_SOURCES.globe}
                  trigger="hover" 
                  size={LORDICON_SIZES.lg}
                  colorize="currentColor"
                />
                Global Crisis Map
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <Lordicon 
                        src={LORDICON_SOURCES.info}
                        trigger="hover" 
                        size={LORDICON_SIZES.md}
                        colorize="currentColor"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>Interactive map showing crisis locations. Filter by region, severity, country, or disaster type.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <Link href="/dashboard/map">
                <Button variant="ghost" size="sm" className="gap-1">
                  View Full Map
                  <Badge variant="secondary" className="ml-1 text-xs">+ More Filters</Badge>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pb-3 space-y-3">
            {/* Filters Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
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
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                  <SelectItem value="high">High & Above</SelectItem>
                  <SelectItem value="medium">Medium & Above</SelectItem>
                  <SelectItem value="low">All Including Low</SelectItem>
                </SelectContent>
              </Select>

              <Combobox
                options={availableCountries.map(country => ({
                  value: country,
                  label: country
                }))}
                value={countryFilter}
                onValueChange={setCountryFilter}
                placeholder="Search country..."
                searchPlaceholder="Type to search..."
                emptyText="No country found."
                className="h-8 w-[160px] text-xs"
              />

              {hasActiveMapFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs px-2"
                  onClick={() => {
                    setCountryFilter("");
                    setDisasterTypeFilters([]);
                    setLocationFilter("all");
                    setSeverityFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="h-[500px] rounded-md overflow-hidden border">
              <CrisisMap regions={filteredRegions} focusRegion={locationFilter} />
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span>Critical</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <span>High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Low</span>
                </div>
              </div>
              <span>{filteredRegions.length} locations</span>
            </div>

            {/* Disaster Type Breakdown */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Disaster Type Breakdown</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <Lordicon 
                          src={LORDICON_SOURCES.info}
                          trigger="hover" 
                          size={LORDICON_SIZES.sm}
                          colorize="currentColor"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Distribution of different types of disasters detected in the selected time range</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {!loading && disasterTypes.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {disasterTypes.reduce((sum, t) => sum + t.count, 0)} total
                  </span>
                )}
              </div>
              {loading ? (
                <div className="flex items-center gap-2 py-2">
                  <LoadingSpinner size={16} />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : disasterTypes.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No disaster type data available
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {disasterTypes.map((type, index) => {
                    const colors = [
                      '#dc2626',
                      '#ea580c',
                      '#f59e0b',
                      '#10b981',
                      '#6366f1',
                    ];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div
                        key={type.name}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
                        style={{ 
                          backgroundColor: `${color}15`,
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs capitalize" style={{ color }}>
                          {type.name}
                        </span>
                        <span className="text-xs font-semibold" style={{ color }}>
                          {type.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Severity & Sentiment */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                Severity Trends
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <Lordicon 
                        src={LORDICON_SOURCES.info}
                        trigger="hover" 
                        size={LORDICON_SIZES.md}
                        colorize="currentColor"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>Time series showing incident count and average severity over the last 48 hours</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              {loading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <LoadingSpinner size={48} text="Loading chart..." />
                </div>
              ) : timeSeriesData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No time series data available
                </div>
              ) : (
                <ChartContainer config={timeSeriesChartConfig} className="h-[280px] w-full">
                  <LineChart data={timeSeriesData} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line 
                    type="monotone" 
                      dataKey="incident_count" 
                      stroke="var(--color-incident_count)" 
                      strokeWidth={3}
                      dot={{ fill: "var(--color-incident_count)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_severity" 
                      stroke="var(--color-avg_severity)" 
                      strokeWidth={3}
                      dot={{ fill: "var(--color-avg_severity)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
              </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Sentiment Trends */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                Sentiment Trends
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <Lordicon 
                        src={LORDICON_SOURCES.info}
                        trigger="hover" 
                        size={LORDICON_SIZES.md}
                        colorize="currentColor"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>Average sentiment score of crisis-related social media posts. Higher scores indicate more positive sentiment, lower scores indicate more negative/urgent sentiment.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              {loading ? (
                <div className="h-[180px] flex items-center justify-center">
                  <LoadingSpinner size={32} text="Loading..." />
                </div>
              ) : sentimentData.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                  No sentiment data available
                </div>
              ) : (
                <>
                  <ChartContainer config={chartConfig} className="h-[180px] w-full">
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
                      <XAxis 
                        dataKey="time" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 10 }}
                        domain={[0, 100]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="sentiment" 
                        stroke="var(--color-sentiment)" 
                        fill="url(#fillSentiment)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {(() => {
                      const validData = sentimentData.filter(d => d.sentiment !== null);
                      const currentValue = validData[validData.length - 1]?.sentiment ?? null;
                      const firstValue = validData[0]?.sentiment ?? null;
                      const avgValue = validData.length > 0 
                        ? validData.reduce((sum, d) => sum + (d.sentiment || 0), 0) / validData.length
                        : null;
                      const changeValue = currentValue !== null && firstValue !== null 
                        ? currentValue - firstValue 
                        : null;

                      return (
                        <>
                          <div className="p-2 rounded-lg bg-muted/30">
                            <div className="text-lg font-bold">
                              {currentValue !== null ? currentValue.toFixed(0) : "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">Current</div>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/30">
                            <div className="text-lg font-bold">
                              {avgValue !== null ? avgValue.toFixed(0) : "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">Average</div>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/30">
                            <div className={`text-lg font-bold ${
                              changeValue !== null && changeValue > 0
                                ? "text-green-600 dark:text-green-400" 
                                : changeValue !== null && changeValue < 0
                                ? "text-red-600 dark:text-red-400"
                                : ""
                            }`}>
                              {changeValue !== null 
                                ? `${changeValue > 0 ? "+" : ""}${changeValue.toFixed(0)}`
                                : "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">Change</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Latest Crisis Events - List View */}
      <Card>
        <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
                        <Lordicon 
                src={LORDICON_SOURCES.dataFeed}
                        trigger="hover" 
                size={LORDICON_SIZES.lg}
                        colorize="currentColor"
                      />
              Latest Crisis Events
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <Lordicon 
                            src={LORDICON_SOURCES.info}
                            trigger="hover" 
                            size={LORDICON_SIZES.md}
                            colorize="currentColor"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                  <p>Real-time crisis events detected from social media and other sources, sorted by most recent</p>
                      </TooltipContent>
                    </Tooltip>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 h-7 w-[160px] text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                </div>
              <Link href="/dashboard/data-feed">
                <Button variant="ghost" size="sm" className="gap-1 h-7">
                  View All
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-3 p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">Severity:</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span className="text-xs">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <span className="text-xs">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span className="text-xs">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs">Low</span>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">Sentiment:</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-600"></div>
                  <span className="text-xs">Urgent/Fearful</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                  <span className="text-xs">Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                  <span className="text-xs">Positive</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner size={48} text="Loading events..." />
            </div>
          ) : displayedEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No events found
            </div>
          ) : (
            <div className="space-y-3">
              {displayedEvents.slice(0, 8).map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border hover:bg-accent/50 transition-colors space-y-2"
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        className={`text-xs px-2 py-0.5 border ${
                          event.severity.toLowerCase() === "critical" 
                            ? "!bg-red-500/10 !text-red-700 dark:!bg-red-950/50 dark:!text-red-300"
                            : event.severity.toLowerCase() === "high"
                            ? "!bg-orange-500/10 !text-orange-700 dark:!bg-orange-950/50 dark:!text-orange-300"
                            : event.severity.toLowerCase() === "medium"
                            ? "!bg-yellow-500/10 !text-yellow-700 dark:!bg-yellow-950/50 dark:!text-yellow-300"
                            : event.severity.toLowerCase() === "low"
                            ? "!bg-green-500/10 !text-green-700 dark:!bg-green-950/50 dark:!text-green-300"
                            : "!bg-blue-500/10 !text-blue-700 dark:!bg-blue-950/50 dark:!text-blue-300"
                        }`}
                      >
                        {event.severity}
                      </Badge>
                      {event.sentiment && (
                        <SentimentBadge
                          sentiment={event.sentiment}
                          sentiment_score={event.sentiment_score}
                          showLabel={true}
                          size="sm"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {event.event_time ? formatActivityTime(event.event_time) : event.time}
                      </div>
                      {event.bluesky_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(event.bluesky_url, '_blank')}
                          className="h-7 gap-1 text-xs"
                        >
                          <BlueskyIcon className="text-[#1185fe]" size={14} />
                          <span className="hidden sm:inline">View Post</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Title and Location */}
                  <div>
                    <div className="font-semibold text-base mb-1">{event.title}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Lordicon 
                        src={LORDICON_SOURCES.location}
                        trigger="hover" 
                        size={14}
                        colorize="currentColor"
                      />
                      {event.location}
                </div>
              </div>

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {event.description}
                    </p>
                  )}
        </div>
              ))}
      </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}