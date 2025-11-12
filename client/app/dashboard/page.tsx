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
  type ChartConfig
} from "@/components/ui/chart";
import { AreaChart, Area } from "recharts";
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
  event_time?: string | null;
  severity: string;
  severityColor: string;
  bluesky_url?: string;
  sentiment?: string | null;
  sentiment_score?: number | null;
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
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Enable real-time alert notifications
  useAlertNotifications({
    userId: user?.user_id ? parseInt(user.user_id, 10) : undefined,
    enabled: !!user?.user_id
  });

  useEffect(() => {
    let cancelled = false;
    const fetchDashboardData = async () => {
      try {
        setIsRefreshing(true);
        setLoading(true);

        const timeParam = timeRange || '24h';
        const [statsData, sentimentResponse, eventsResponse, incidentsData] = await Promise.all([
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
        ]);

        if (cancelled) return;

        setStats(statsData);
        setSentimentData(sentimentResponse.trends);
        setRecentEvents(eventsResponse.events);
        setRegions(incidentsData);
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

  const toggleDisasterType = (type: string) => {
    setDisasterTypeFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const availableDisasterTypes = ["earthquake", "flood", "fire", "storm", "tsunami", "other"];
  const hasActiveMapFilters = countryFilter !== "" || disasterTypeFilters.length > 0;

  const availableCountries = useMemo(() => {
    const countries = [...new Set(regions.map(r => r.region))].sort();
    return countries;
  }, [regions]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
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
          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard/map">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Lordicon 
                      src={LORDICON_SOURCES.globe}
                      trigger="hover"
                      size={LORDICON_SIZES.lg}
                      colorize="currentColor"
                    />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>View Global Crisis Map</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard/settings">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Lordicon 
                      src={LORDICON_SOURCES.location}
                      trigger="hover"
                      size={LORDICON_SIZES.lg}
                      colorize="currentColor"
                    />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Update Location</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard/alerts">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Lordicon 
                      src={LORDICON_SOURCES.bell}
                      trigger="hover"
                      size={LORDICON_SIZES.lg}
                      colorize="currentColor"
                    />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Configure Alerts</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard/data-feed">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Lordicon 
                      src={LORDICON_SOURCES.dataFeed}
                      trigger="hover"
                      size={LORDICON_SIZES.lg}
                      colorize="currentColor"
                    />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>View All Events</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-8 w-px bg-border"></div>

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

      {/* Key Metrics Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold">Key Metrics</h2>
          <div className="flex-1 h-px bg-border"></div>
        </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {loading ? "-" : stats.total_crises.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  Total Crises
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lordicon 
                        src={LORDICON_SOURCES.info}
                        trigger="hover" 
                        size={LORDICON_SIZES.xs}
                        colorize="currentColor"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Total number of detected crisis events in the selected time period from all monitored sources</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Lordicon
                src={LORDICON_SOURCES.globe}
                trigger="play-once-then-hover"
                size={LORDICON_SIZES["3xl"]}
                colorize="currentColor"
              />
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
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  Affected People
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lordicon 
                        src={LORDICON_SOURCES.info}
                        trigger="hover" 
                        size={LORDICON_SIZES.xs}
                        colorize="currentColor"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Estimated population affected by active crises based on location data and population density analysis</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <Lordicon
                src={LORDICON_SOURCES.people}
                trigger="play-once-then-hover"
                size={LORDICON_SIZES["3xl"]}
                colorize="currentColor"
              />
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
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  Urgent Alerts
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lordicon 
                        src={LORDICON_SOURCES.info}
                        trigger="hover" 
                        size={LORDICON_SIZES.xs}
                        colorize="currentColor"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Number of high-severity (Level 4-5) alerts requiring immediate attention</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Lordicon
                  src="https://cdn.lordicon.com/vihyezfv.json"
                  trigger="play-once-then-hover"
                  size={32}
                  colorize="currentColor"
                />
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
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  Active Regions
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lordicon 
                        src={LORDICON_SOURCES.info}
                        trigger="hover" 
                        size={LORDICON_SIZES.xs}
                        colorize="currentColor"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Number of distinct geographic regions currently experiencing crisis events</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <Lordicon
                  src="https://cdn.lordicon.com/zosctjws.json"
                  trigger="play-once-then-hover"
                  size={32}
                  colorize="currentColor"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Global Crisis Heatmap Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold">Global Crisis Heatmap</h2>
          <div className="flex-1 h-px bg-border"></div>
        </div>

      <Card>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              Live Crisis Map
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
                  <p>Interactive map showing real-time crisis locations worldwide. Marker size indicates severity. Click markers for details.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
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

          {/* Additional Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
            <div className="flex-1 min-w-[200px]">
              <Combobox
                options={availableCountries.map(country => ({
                  value: country,
                  label: country
                }))}
                value={countryFilter}
                onValueChange={setCountryFilter}
                placeholder="All Countries"
                searchPlaceholder="Search countries..."
                emptyText="No country found."
                className="h-8 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Crisis Type:</span>
              {availableDisasterTypes.map((type) => (
                <Badge
                  key={type}
                  variant={disasterTypeFilters.includes(type) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 transition-opacity capitalize text-xs h-6"
                  onClick={() => toggleDisasterType(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Active Filter Indicators */}
          {hasActiveMapFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {countryFilter && (
                <Badge variant="secondary" className="gap-1 text-xs h-6">
                  {countryFilter}
                  <span onClick={() => setCountryFilter("")} className="cursor-pointer hover:text-destructive">
                    <Lordicon 
                      src={LORDICON_SOURCES.close}
                      trigger="hover" 
                      size={LORDICON_SIZES.xs}
                      colorize="currentColor"
                    />
                  </span>
                </Badge>
              )}
              {disasterTypeFilters.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1 capitalize text-xs h-6">
                  {type}
                  <span onClick={() => toggleDisasterType(type)} className="cursor-pointer hover:text-destructive">
                    <Lordicon 
                      src={LORDICON_SOURCES.close}
                      trigger="hover" 
                      size={LORDICON_SIZES.xs}
                      colorize="currentColor"
                    />
                  </span>
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => {
                  setCountryFilter("");
                  setDisasterTypeFilters([]);
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="pb-3">
          <div className="h-[500px] rounded-md overflow-hidden border">
            <CrisisMap regions={filteredRegions} focusRegion={locationFilter} />
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Recent Activity & Insights Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold">Recent Activity & Insights</h2>
          <div className="flex-1 h-px bg-border"></div>
        </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                Latest Events
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
                  <p>Chronological list of detected crisis events from monitored sources. Click &quot;View on Bluesky&quot; to see original social media posts.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-8 h-8 w-[180px] text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <LoadingSpinner size={48} text="Loading events..." />
              </div>
            ) : displayedEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No events found in this time frame. Try expanding your time range or adjusting your search.
              </div>
            ) : (
              <>
                {displayedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex gap-1.5 mt-0.5">
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
                            showLabel={false}
                            size="sm"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{event.title}</div>
                        <div className="text-xs text-muted-foreground mb-1">{event.location}</div>
                        <div className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">
                          {event.description}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {event.event_time ? formatActivityTime(event.event_time) : event.time}
                      </div>
                    </div>
                    {event.bluesky_url && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(event.bluesky_url, '_blank')}
                        >
                          <BlueskyIcon className="text-[#1185fe]" size={12} />
                          View on Bluesky
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {recentEvents.length > 5 && (
                  <div className="pt-3 flex justify-center border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllEvents(!showAllEvents)}
                      className="gap-2"
                    >
                      {showAllEvents ? (
                        <>Show Less</>
                      ) : (
                        <>
                          Show All {recentEvents.length} Events
                          <ExternalLink className="h-3 w-3" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                Sentiment Trends
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
                    <p>Aggregate sentiment analysis of social media posts related to crisis events. Shows emotional tone (negative/neutral/positive) over time</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
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
                  {loading ? <LoadingSpinner size={16} /> : sentimentData.length > 0 ? "Recent trend" : "No data"}
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
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    Active Monitors
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lordicon 
                        src={LORDICON_SOURCES.info}
                        trigger="hover" 
                        size={LORDICON_SIZES.xs}
                        colorize="currentColor"
                      />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>24/7 automated monitoring systems tracking multiple data sources</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="text-sm font-medium">24/7</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    Data Sources
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lordicon 
                        src={LORDICON_SOURCES.info}
                        trigger="hover" 
                        size={LORDICON_SIZES.xs}
                        colorize="currentColor"
                      />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>Number of active data feeds (Bluesky, news APIs, etc.)</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="text-sm font-medium">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    Avg Response
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lordicon 
                        src={LORDICON_SOURCES.info}
                        trigger="hover" 
                        size={LORDICON_SIZES.xs}
                        colorize="currentColor"
                      />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>Average time from crisis detection to alert generation</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="text-sm font-medium">8.5 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    System Status
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lordicon 
                        src={LORDICON_SOURCES.info}
                        trigger="hover" 
                        size={LORDICON_SIZES.xs}
                        colorize="currentColor"
                      />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>Real-time health status of monitoring systems</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                    Operational
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>

    </div>
  );
}