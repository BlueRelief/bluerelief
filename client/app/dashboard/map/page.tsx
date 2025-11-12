"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lordicon } from "@/components/lordicon";
import { LORDICON_SOURCES, LORDICON_SIZES } from "@/lib/lordicon-config";
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
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [showFilters, setShowFilters] = useState(false);

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

  const availableDisasterTypes = ["earthquake", "flood", "fire", "storm", "tsunami", "other"];
  const hasActiveMapFilters = countryFilter !== "" || disasterTypeFilters.length > 0;

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

  const formatTimeRangeLabel = (val: string) => {
    switch (val) {
      case '6h': return 'Last 6 Hours';
      case '12h': return 'Last 12 Hours';
      case '24h': return 'Last 24 Hours';
      case '48h': return 'Last 48 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      default: return 'Last 24 Hours';
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

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Left Sidebar - Filters & Info */}
      <div className="w-80 bg-background border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div>
            <h1 className="text-xl font-bold mb-1">Global Crisis Map</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Live data</span>
              <span>•</span>
              <span>{lastUpdatedText()}</span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-center mb-2">
              <div className="text-3xl font-bold">{filteredRegions.length}</div>
              <div className="text-xs text-muted-foreground">Active Locations</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                <span className="text-xs">Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-orange-500"></div>
                <span className="text-xs">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                <span className="text-xs">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <span className="text-xs">Low</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Compact */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex gap-2">
            <Select value={timeRange || "24h"} onValueChange={setTimeRange}>
              <SelectTrigger className="flex-1 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6h">6h</SelectItem>
                <SelectItem value="12h">12h</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="48h">48h</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
                <SelectItem value="30d">30d</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="flex-1 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full h-9">
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

          <div>
            <div className="text-xs text-muted-foreground mb-2">Crisis Type</div>
            <div className="grid grid-cols-2 gap-2">
              {availableDisasterTypes.map((type) => (
                <Button
                  key={type}
                  variant={disasterTypeFilters.includes(type) ? "default" : "outline"}
                  size="sm"
                  className="capitalize h-8"
                  onClick={() => toggleDisasterType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {hasActiveMapFilters && (
            <>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">Filters Active</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
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
                  <Badge variant="secondary" className="text-xs">
                    {locationFilter}
                    <button onClick={() => setLocationFilter("all")} className="ml-1">×</button>
                  </Badge>
                )}
                {severityFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    {severityFilter}
                    <button onClick={() => setSeverityFilter("all")} className="ml-1">×</button>
                  </Badge>
                )}
                {countryFilter && (
                  <Badge variant="secondary" className="text-xs">
                    {countryFilter}
                    <button onClick={() => setCountryFilter("")} className="ml-1">×</button>
                  </Badge>
                )}
                {disasterTypeFilters.map((type) => (
                  <Badge key={type} variant="secondary" className="text-xs capitalize">
                    {type}
                    <button onClick={() => toggleDisasterType(type)} className="ml-1">×</button>
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <CrisisMap regions={filteredRegions} focusRegion={locationFilter} />
      </div>
    </div>
  );
}

