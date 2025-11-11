"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp, AlertTriangle, Activity, Target, Filter, X, Info, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  getAnalysisKeyMetrics,
  getAnalysisTrends,
  getAnalysisRegionalAnalysis,
  getAnalysisStatistics,
  getAnalysisPatterns,
  getAnalysisFilterOptions
} from "@/lib/api-client";

const CrisisMap = dynamic(() => import("@/components/crisis-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/20">
      <div className="text-sm text-muted-foreground">Loading map...</div>
    </div>
  ),
});


// Utility functions for data formatting
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString();
};

const formatPercentage = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0%';
  return `${num.toFixed(0)}%`;
};

const formatTime = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined) return '0m';
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const formatLargeNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const validateApiData = (data: unknown, dataType: string): boolean => {
  if (!data) {
    console.warn(`${dataType} data is null or undefined`);
    return false;
  }
  return true;
};

// Comparison Indicator Component
const ComparisonIndicator = ({ 
  current, 
  previous, 
  isLowerBetter = false 
}: { 
  current: number; 
  previous: number; 
  isLowerBetter?: boolean;
}) => {
  if (previous === 0) return null;
  
  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;
  const isImprovement = isLowerBetter ? change < 0 : change > 0;
  
  return (
    <div className={`flex items-center gap-1 text-xs ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      <span className="font-medium">{Math.abs(change).toFixed(1)}%</span>
      <span className="text-muted-foreground">vs previous</span>
    </div>
  );
};

export default function AnalysisPage() {
  // Filter state
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedDisasterTypes, setSelectedDisasterTypes] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableDisasterTypes, setAvailableDisasterTypes] = useState<string[]>([]);
  
  // Comparison state
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  
  // State for API data
  const [keyMetrics, setKeyMetrics] = useState<{
    total_incidents: number;
    high_priority: number;
    response_rate: number;
    avg_response_time: number;
    tweets_recognized: number;
    prediction_accuracy: number;
    anomalies_detected: number;
  } | null>(null);
  
  // Previous period metrics for comparison
  const [previousMetrics, setPreviousMetrics] = useState<{
    total_incidents: number;
    high_priority: number;
    response_rate: number;
    avg_response_time: number;
  } | null>(null);

  const [trends, setTrends] = useState<Array<{
    date: string;
    high_priority: number;
    medium_priority: number;
    total_incidents: number;
  }>>([]);

  const [statistics, setStatistics] = useState<{
    tweets_recognized: number;
    prediction_accuracy: number;
    anomalies_detected: number;
    total_affected_population: number;
    sentiment_breakdown: {
      positive: number;
      negative: number;
      neutral: number;
      urgent: number;
      fearful: number;
    };
  } | null>(null);

  const [patterns, setPatterns] = useState<{
    recurring_patterns: {
      count: number;
    };
    pattern_types: {
      [key: string]: number;
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleDisasterType = (type: string) => {
    setSelectedDisasterTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };
  
  // Helper function to calculate date ranges for comparison
  const getDateRanges = () => {
    const now = new Date();
    const currentEnd = now.toISOString().split('T')[0];
    
    let currentStart: string;
    let previousStart: string;
    let previousEnd: string;
    
    if (comparisonPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      currentStart = weekAgo.toISOString().split('T')[0];
      previousStart = twoWeeksAgo.toISOString().split('T')[0];
      previousEnd = weekAgo.toISOString().split('T')[0];
    } else if (comparisonPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      currentStart = monthAgo.toISOString().split('T')[0];
      previousStart = twoMonthsAgo.toISOString().split('T')[0];
      previousEnd = monthAgo.toISOString().split('T')[0];
    } else { // quarter
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const twoQuartersAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      currentStart = quarterAgo.toISOString().split('T')[0];
      previousStart = twoQuartersAgo.toISOString().split('T')[0];
      previousEnd = quarterAgo.toISOString().split('T')[0];
    }
    
    return { currentStart, currentEnd, previousStart, previousEnd };
  };

  const clearFilters = () => {
    setSelectedCountry("");
    setSelectedDisasterTypes([]);
  };

  const hasActiveFilters = selectedCountry !== "" || selectedDisasterTypes.length > 0;

  const retryFetch = () => {
    setError(null);
    setLoading(true);
    // Trigger useEffect by updating a dependency
    window.location.reload();
  };

  const chartConfig = {
    highPriority: {
      label: "High Priority",
      color: "oklch(0.6368 0.2078 25.3313)",
    },
    mediumPriority: {
      label: "Medium Priority",
      color: "oklch(0.5593 0.1942 258.4556)",
    },
    totalIncidents: {
      label: "Total Incidents",
      color: "oklch(0.7137 0.1434 254.6240)",
    },
  } satisfies ChartConfig;

  const regionalData: { region: string; incidents: number; severity: string; coordinates: [number, number] }[] = [
    { region: 'Coastal Region', incidents: 120, severity: 'High', coordinates: [-74.006, 40.7128] },
    { region: 'Inland Valley', incidents: 85, severity: 'Medium', coordinates: [-118.2437, 34.0522] },
    { region: 'Northern Highlands', incidents: 45, severity: 'Medium', coordinates: [-122.6765, 45.5231] },
    { region: 'Southern Basin', incidents: 170, severity: 'Critical', coordinates: [-95.3698, 29.7604] },
  ];

  const [regions, setRegions] = useState(regionalData);

  // // This will contain empty heatmap data until we add onto it
  // const heatmapData = [
  //   [0.45, 0.32, 0.28, 0.51, 0.38, 0.67, 0.42, 0.55, 0.29, 0.48, 0.61, 0.35],
  //   [0.52, 0.41, 0.36, 0.58, 0.44, 0.72, 0.38, 0.62, 0.25, 0.54, 0.68, 0.41],
  //   [0.38, 0.29, 0.48, 0.62, 0.51, 0.45, 0.58, 0.33, 0.69, 0.47, 0.55, 0.39],
  //   [0.63, 0.47, 0.52, 0.41, 0.59, 0.35, 0.67, 0.44, 0.28, 0.61, 0.38, 0.54],
  //   [0.48, 0.55, 0.39, 0.64, 0.42, 0.58, 0.33, 0.71, 0.46, 0.52, 0.37, 0.68],
  //   [0.55, 0.36, 0.61, 0.49, 0.43, 0.58, 0.71, 0.39, 0.54, 0.47, 0.62, 0.35],
  //   [0.42, 0.58, 0.45, 0.67, 0.33, 0.52, 0.39, 0.61, 0.48, 0.36, 0.74, 0.41],
  //   [0.58, 0.44, 0.69, 0.37, 0.53, 0.41, 0.62, 0.35, 0.47, 0.59, 0.28, 0.64]
  // ];

  // const getHeatmapColor = (intensity: number) => {
  //   if (intensity < 0.3) return 'oklch(0.9683 0.0069 247.8956)';
  //   if (intensity < 0.5) return 'oklch(0.8091 0.0956 251.8128)';
  //   if (intensity < 0.7) return 'oklch(0.6128 0.1689 257.5652)';
  //   return 'oklch(0.5593 0.1942 258.4556)';
  // };

  
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      default: return 'secondary';
    }
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const options = await getAnalysisFilterOptions();
        setAvailableCountries(options.countries);
        setAvailableDisasterTypes(options.disaster_types);
      } catch (e) {
        console.error('Failed to fetch filter options:', e);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        setLoading(true);
        setError(null);

        const country = selectedCountry || undefined;
        const disasterType = selectedDisasterTypes.length > 0 
          ? selectedDisasterTypes.join(',') 
          : undefined;

        // Get date ranges for comparison if enabled
        const dateRanges = comparisonEnabled ? getDateRanges() : null;

        // Fetch all analysis data in parallel
        const promises = [
          dateRanges 
            ? getAnalysisKeyMetrics(country, disasterType, dateRanges.currentStart, dateRanges.currentEnd)
            : getAnalysisKeyMetrics(country, disasterType),
          getAnalysisTrends(30, country, disasterType),
          getAnalysisRegionalAnalysis(country, disasterType),
          getAnalysisStatistics(country, disasterType),
          getAnalysisPatterns(country, disasterType)
        ];
        
        // Fetch previous period data if comparison is enabled
        if (comparisonEnabled && dateRanges) {
          promises.push(
            getAnalysisKeyMetrics(country, disasterType, dateRanges.previousStart, dateRanges.previousEnd)
          );
        }
        
        const results = await Promise.all(promises);
        
        const keyMetricsData = results[0] as {
          total_incidents: number;
          high_priority: number;
          response_rate: number;
          avg_response_time: number;
          tweets_recognized: number;
          prediction_accuracy: number;
          anomalies_detected: number;
        };
        const trendsData = results[1] as Array<{
          date: string;
          high_priority: number;
          medium_priority: number;
          total_incidents: number;
        }>;
        const regionalData = results[2] as Array<{
          region: string;
          incident_count: number;
          severity: string;
          coordinates: [number, number];
        }>;
        const statisticsData = results[3] as {
          tweets_recognized: number;
          prediction_accuracy: number;
          anomalies_detected: number;
          total_affected_population: number;
          sentiment_breakdown: {
            positive: number;
            negative: number;
            neutral: number;
            urgent: number;
            fearful: number;
          };
        };
        const patternsData = results[4] as {
          recurring_patterns: {
            count: number;
          };
          pattern_types: {
            [key: string]: number;
          };
        };
        const previousMetricsData = comparisonEnabled && results.length > 5 ? results[5] as {
          total_incidents: number;
          high_priority: number;
          response_rate: number;
          avg_response_time: number;
        } : null;

        // Validate and set data
        if (validateApiData(keyMetricsData, 'Key Metrics')) {
          setKeyMetrics(keyMetricsData);
        }
        if (comparisonEnabled && previousMetricsData && validateApiData(previousMetricsData, 'Previous Metrics')) {
          setPreviousMetrics(previousMetricsData);
        } else {
          setPreviousMetrics(null);
        }
        if (validateApiData(trendsData, 'Trends')) {
          setTrends(trendsData);
        }
        if (validateApiData(regionalData, 'Regional')) {
          // Transform API data to match component interface
          const transformedRegions = regionalData.map((region) => ({
            region: region.region,
            incidents: region.incident_count,
            severity: region.severity,
            coordinates: region.coordinates
          }));
          setRegions(transformedRegions);
        }
        if (validateApiData(statisticsData, 'Statistics')) {
          setStatistics(statisticsData);
        }
        if (validateApiData(patternsData, 'Patterns')) {
          setPatterns(patternsData);
        }
        } catch (e) {
        console.error('Failed to fetch analysis data:', e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
        setError(`Failed to load analysis data: ${errorMessage}. Please check your connection and try again.`);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, selectedDisasterTypes, comparisonEnabled, comparisonPeriod]);

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Analysis</h1>
          <p className="text-muted-foreground">
            Crisis data analysis and trends visualization
          </p>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-lg font-medium text-destructive mb-2">Error Loading Data</div>
            <div className="text-sm text-muted-foreground mb-4">{error}</div>
            <button 
              onClick={retryFetch} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Analysis</h1>
        <p className="text-muted-foreground">
          Crisis data analysis and trends visualization
        </p>
        {loading && (
          <div className="mt-2 text-sm text-muted-foreground">
            Loading real-time analysis data...
          </div>
        )}
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Filters & Comparison</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Comparison Toggle */}
          <div className="mb-6 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={comparisonEnabled}
                  onCheckedChange={setComparisonEnabled}
                  id="comparison-mode"
                />
                <label htmlFor="comparison-mode" className="text-sm font-medium cursor-pointer">
                  Enable Historical Comparison
                </label>
              </div>
              {comparisonEnabled && (
                <Select value={comparisonPeriod} onValueChange={(value) => setComparisonPeriod(value as 'week' | 'month' | 'quarter')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week vs Week</SelectItem>
                    <SelectItem value="month">Month vs Month</SelectItem>
                    <SelectItem value="quarter">Quarter vs Quarter</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {comparisonEnabled && (
              <p className="text-xs text-muted-foreground">
                Comparing current {comparisonPeriod} with previous {comparisonPeriod}
              </p>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Country Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Combobox
                options={availableCountries.map(country => ({
                  value: country,
                  label: country
                }))}
                value={selectedCountry}
                onValueChange={setSelectedCountry}
                placeholder="All Countries"
                searchPlaceholder="Search countries..."
                emptyText="No country found."
              />
            </div>

            {/* Disaster Type Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Disaster Types</label>
              <div className="flex flex-wrap gap-2">
                {availableDisasterTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={selectedDisasterTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 transition-opacity capitalize"
                    onClick={() => toggleDisasterType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {selectedCountry && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCountry}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setSelectedCountry("")}
                    />
                  </Badge>
                )}
                {selectedDisasterTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="gap-1 capitalize">
                    {type}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => toggleDisasterType(type)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              Total Incidents
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Total number of crisis incidents detected and analyzed by the system across all regions and disaster types</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(keyMetrics?.total_incidents)}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                {keyMetrics
                  ? `${(keyMetrics.total_incidents === 0 ? 0 : (keyMetrics.high_priority / keyMetrics.total_incidents) * 100).toFixed(1)}% high priority`
                  : 'Loading...'}
              </p>
              {comparisonEnabled && previousMetrics && keyMetrics && (
                <ComparisonIndicator 
                  current={keyMetrics.total_incidents} 
                  previous={previousMetrics.total_incidents} 
                  isLowerBetter={true}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              High Priority
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Number of high-severity incidents requiring immediate attention and rapid response from emergency services</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(keyMetrics?.high_priority)}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                {keyMetrics
                  ? `${(keyMetrics.total_incidents === 0 ? 0 : (keyMetrics.high_priority / keyMetrics.total_incidents) * 100).toFixed(1)}% of total incidents`
                  : 'Loading...'}
              </p>
              {comparisonEnabled && previousMetrics && keyMetrics && (
                <ComparisonIndicator 
                  current={keyMetrics.high_priority} 
                  previous={previousMetrics.high_priority} 
                  isLowerBetter={true}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              Response Rate
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Percentage of incidents that received a timely system response and alert generation. Higher is better.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatPercentage(keyMetrics?.response_rate)}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                System response efficiency
              </p>
              {comparisonEnabled && previousMetrics && keyMetrics && (
                <ComparisonIndicator 
                  current={keyMetrics.response_rate} 
                  previous={previousMetrics.response_rate} 
                  isLowerBetter={false}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              Avg Response Time
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Average time between crisis detection and system alert generation. Lower times indicate faster response capabilities.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatTime(keyMetrics?.avg_response_time)}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
              {comparisonEnabled && previousMetrics && keyMetrics && (
                <ComparisonIndicator 
                  current={keyMetrics.avg_response_time} 
                  previous={previousMetrics.avg_response_time} 
                  isLowerBetter={true}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crisis Trend Analysis */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Crisis Trend Analysis (2025)
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>Monthly trend chart showing total incidents and priority breakdown. Reference line indicates target response threshold.</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monthly crisis incidents by priority level
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-96 w-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-96 w-full">
              <LineChart data={trends} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <ReferenceLine 
                y={50} 
                stroke="oklch(0.7107 0.0351 256.7878)" 
                strokeDasharray="3 3"
                label={{ value: "Target", position: "right", fill: "oklch(0.5544 0.0407 257.4166)" }}
              />
              <Line 
                type="monotone" 
                dataKey="high_priority" 
                stroke="var(--color-highPriority)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-highPriority)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="medium_priority" 
                stroke="var(--color-mediumPriority)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-mediumPriority)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="total_incidents" 
                stroke="var(--color-totalIncidents)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "var(--color-totalIncidents)", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Heatmap and Pattern Recognition Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Regional Analysis Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Regional Analysis Heatmap
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Geographic visualization of crisis incidents by region with severity levels and incident counts</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Crisis distribution by geographic region
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-80 w-full rounded-lg overflow-hidden mb-4 relative">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center bg-muted/20">
                    <div className="text-center">
                      <Skeleton className="h-8 w-8 rounded-full mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">Loading map...</div>
                    </div>
                  </div>
                ) : (
                  <CrisisMap regions={regions} />
                )}
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-destructive rounded-full inline-block"></span>
                  <span>Critical/High</span>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <span className="w-3 h-3 bg-primary rounded-full inline-block"></span>
                  <span>Medium</span>
                </div>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-2 w-20 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : regions.length > 0 ? (
                regions.map((region, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{region.region}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(region.incidents)} incidents
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityVariant(region.severity)}>
                        {region.severity}
                      </Badge>
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (region.incidents / 200) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <div className="text-center">
                    <div className="text-lg font-medium mb-2">No Regional Data Available</div>
                    <div className="text-sm">Regional analysis will appear here when data is connected</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pattern Recognition Cards - Bigger and Side by Side */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pattern Recognition
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Machine learning insights showing recurring crisis patterns, social media analysis, prediction accuracy, and detected anomalies</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              AI-detected crisis patterns and anomalies
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Main Pattern Recognition Card */}
              <div className="p-6 border-2 border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-primary rounded-full"></div>
                    <span className="text-lg font-semibold">Recurring Crisis Patterns</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-6 w-8" />
                  ) : (
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {patterns?.recurring_patterns?.count || 0}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  AI has identified recurring patterns in crisis data across multiple regions
                </p>
              </div>

              {/* Secondary Cards */}
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="font-medium flex items-center gap-1.5">
                        Tweets Recognized
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <p>Total number of social media posts analyzed by AI for crisis indicators and patterns</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </div>
                    {loading ? (
                      <Skeleton className="h-5 w-12" />
                    ) : (
                      <Badge variant="secondary" className="text-base px-2 py-1">
                        {formatLargeNumber(statistics?.tweets_recognized)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Social media posts analyzed for crisis indicators
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium flex items-center gap-1.5">
                        Prediction Accuracy
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <p>Machine learning model accuracy rate for correctly predicting and classifying crisis events</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </div>
                    {loading ? (
                      <Skeleton className="h-5 w-12" />
                    ) : (
                      <Badge variant="secondary" className="text-base px-2 py-1">
                        {formatPercentage(statistics?.prediction_accuracy)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI model accuracy in crisis prediction
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium flex items-center gap-1.5">
                        Anomalies Detected
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <p>Unusual crisis patterns or data anomalies flagged by AI that require immediate human review and attention</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </div>
                    {loading ? (
                      <Skeleton className="h-5 w-12" />
                    ) : (
                      <Badge variant="secondary" className="text-base px-2 py-1">
                        {statistics?.anomalies_detected || '0'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unusual patterns requiring immediate attention
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
