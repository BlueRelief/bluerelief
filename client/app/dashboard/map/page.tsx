"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Lordicon } from "@/components/lordicon";
import { LORDICON_SOURCES } from "@/lib/lordicon-config";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useState, useEffect, useMemo } from "react";
import { apiGet } from "@/lib/api-client";
import dynamic from "next/dynamic";

const CrisisMap = dynamic(() => import("@/components/crisis-map"), {
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      <LoadingSpinner size={48} text="Loading map..." />
    </div>
  ),
  ssr: false,
});

export default function MapPage() {
  const [timeRange, setTimeRange] = useState("");
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
  const [, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    let cancelled = false;
    const fetchMapData = async () => {
      try {
        setLoading(true);
        const timeParam = timeRange || '24h';
        const incidentsData = await apiGet<Array<{
          region: string;
          incidents: number;
          severity: string;
          coordinates: [number, number];
          crisis_description?: string;
        }>>(`/api/incidents?time_range=${timeParam}`);

        if (cancelled) return;

        setRegions(incidentsData);
        setLastFetch(new Date());
      } catch (e) {
        console.warn('Failed to fetch map data:', e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMapData();
    return () => { cancelled = true; };
  }, [timeRange]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const toggleDisasterType = (type: string) => {
    setDisasterTypeFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const availableDisasterTypes = ["earthquake", "flood", "wildfire", "hurricane", "tornado", "tsunami", "volcano", "heatwave"];
  const hasActiveFilters = countryFilter !== "" || disasterTypeFilters.length > 0 || locationFilter !== "all" || severityFilter !== "all";

  const availableCountries = useMemo(() => {
    const countries = [...new Set(regions.map(r => r.region))].sort();
    return countries;
  }, [regions]);

  const getRegionFromCoordinates = (lng: number, lat: number): string => {
    if (lng >= -170 && lng <= -50 && lat >= 15 && lat <= 72) return "north-america";
    if (lng >= -82 && lng <= -34 && lat >= -56 && lat <= 13) return "south-america";
    if (lng >= -10 && lng <= 40 && lat >= 36 && lat <= 71) return "europe";
    if (lng >= -18 && lng <= 52 && lat >= -35 && lat <= 37) return "africa";
    if (lng >= 34 && lng <= 63 && lat >= 12 && lat <= 42) return "middle-east";
    if (lng >= 110 && lng <= 180 && lat >= -50 && lat <= 0) return "oceania";
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

      const countryMatch = !countryFilter || region.region.toLowerCase().includes(countryFilter.toLowerCase());
      const disasterTypeMatch = disasterTypeFilters.length === 0 || 
        disasterTypeFilters.some(type => 
          region.crisis_description?.toLowerCase().includes(type.toLowerCase())
        );
      
      return severityMatch && locationMatch && countryMatch && disasterTypeMatch;
    });
  }, [regions, severityFilter, locationFilter, countryFilter, disasterTypeFilters]);

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

  return (
    <div className="flex h-[calc(100vh-100px)]">
      {/* Map Container */}
      <div className="relative flex-1 w-full h-full">
        {/* Map Background */}
        <div className="absolute inset-0 w-full h-full">
          <CrisisMap regions={filteredRegions} focusRegion={locationFilter} />
        </div>
      </div>

      {/* Sidebar - Everything Integrated */}
      <div className="w-[320px] border-l bg-background/95 backdrop-blur-lg flex-shrink-0 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lordicon 
                src={LORDICON_SOURCES.globe}
                trigger="play-once-then-hover"
                size={24}
                colorize="currentColor"
              />
            </div>
            <div>
              <div className="font-bold text-base">Global Crisis Map</div>
              <div className="text-xs text-muted-foreground">{lastUpdatedText()}</div>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Time Range</label>
            <Select value={timeRange || "24h"} onValueChange={setTimeRange}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="12h">Last 12 Hours</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="48h">Last 48 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Region</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
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
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Severity</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                  <SelectItem value="high">High & Above</SelectItem>
                  <SelectItem value="medium">Medium & Above</SelectItem>
                  <SelectItem value="low">All Including Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Country</label>
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
                className="h-9"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Crisis Type</label>
              <div className="grid grid-cols-2 gap-2">
                {availableDisasterTypes.map((type) => (
                  <Button
                    key={type}
                    variant={disasterTypeFilters.includes(type) ? "default" : "outline"}
                    size="sm"
                    className="capitalize h-8 text-xs"
                    onClick={() => toggleDisasterType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

          {hasActiveFilters && (
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Active Filters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => {
                    setCountryFilter("");
                    setDisasterTypeFilters([]);
                    setLocationFilter("all");
                    setSeverityFilter("all");
                  }}
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {locationFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {locationFilter.replace('-', ' ')}
                    <button onClick={() => setLocationFilter("all")} className="ml-1.5">×</button>
                  </Badge>
                )}
                {severityFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {severityFilter}
                    <button onClick={() => setSeverityFilter("all")} className="ml-1.5">×</button>
                  </Badge>
                )}
                {countryFilter && (
                  <Badge variant="secondary" className="text-xs">
                    {countryFilter}
                    <button onClick={() => setCountryFilter("")} className="ml-1.5">×</button>
                  </Badge>
                )}
                {disasterTypeFilters.map((type) => (
                  <Badge key={type} variant="secondary" className="text-xs capitalize">
                    {type}
                    <button onClick={() => toggleDisasterType(type)} className="ml-1.5">×</button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Legend & Stats */}
        <div className="p-4 border-t space-y-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Severity Legend</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                <span className="text-xs font-medium">Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-orange-500"></div>
                <span className="text-xs font-medium">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-medium">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium">Low</span>
              </div>
            </div>
          </div>
          
          <div className="pt-3 border-t">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Statistics</div>
            <div className="text-lg font-bold">
              <span className="text-3xl">{filteredRegions.length}</span>
              <div className="text-muted-foreground text-xs mt-0.5">crisis location{filteredRegions.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
