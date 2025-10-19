"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { TrendingUp, AlertTriangle, Activity, Target } from "lucide-react";

const CrisisMap = dynamic(() => import("@/components/crisis-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/20">
      <div className="text-sm text-muted-foreground">Loading map...</div>
    </div>
  ),
});

export default function AnalysisPage() {
  const crisisData = [
    { month: 'Jan', highPriority: 45, mediumPriority: 32, totalIncidents: 120 },
    { month: 'Feb', highPriority: 52, mediumPriority: 28, totalIncidents: 135 },
    { month: 'Mar', highPriority: 38, mediumPriority: 45, totalIncidents: 145 },
    { month: 'Apr', highPriority: 63, mediumPriority: 38, totalIncidents: 160 },
    { month: 'May', highPriority: 48, mediumPriority: 52, totalIncidents: 155 },
    { month: 'Jun', highPriority: 55, mediumPriority: 42, totalIncidents: 142 },
    { month: 'Jul', highPriority: 42, mediumPriority: 48, totalIncidents: 138 },
    { month: 'Aug', highPriority: 58, mediumPriority: 35, totalIncidents: 148 },
    { month: 'Sep', highPriority: 47, mediumPriority: 41, totalIncidents: 152 },
    { month: 'Oct', highPriority: 61, mediumPriority: 46, totalIncidents: 168 },
    { month: 'Nov', highPriority: 53, mediumPriority: 39, totalIncidents: 158 },
    { month: 'Dec', highPriority: 49, mediumPriority: 44, totalIncidents: 163 }
  ];

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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Analysis</h1>
        <p className="text-muted-foreground">
          Crisis data analysis and trends visualization
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,000</div>
            <p className="text-xs text-muted-foreground">
              +10% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100</div>
            <p className="text-xs text-muted-foreground">
              10% of total incidents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">
              +10% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10m</div>
            <p className="text-xs text-muted-foreground">
              -0.1m from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Crisis Trend Analysis */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Crisis Trend Analysis (2025)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Monthly crisis incidents by priority level
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-96 w-full">
            <LineChart data={crisisData} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
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
                dataKey="highPriority" 
                stroke="var(--color-highPriority)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-highPriority)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="mediumPriority" 
                stroke="var(--color-mediumPriority)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-mediumPriority)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="totalIncidents" 
                stroke="var(--color-totalIncidents)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "var(--color-totalIncidents)", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Heatmap and Pattern Recognition Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Regional Analysis Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Analysis Heatmap</CardTitle>
            <p className="text-sm text-muted-foreground">
              Crisis distribution by geographic region
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-80 w-full rounded-lg overflow-hidden mb-4 relative">
                <CrisisMap regions={regions} />
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
              {regions.length > 0 ? (
                regions.map((region, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{region.region}</div>
                      <div className="text-sm text-muted-foreground">
                        {region.incidents} incidents
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
            <CardTitle>Pattern Recognition</CardTitle>
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
                  <Badge variant="default" className="text-lg px-3 py-1">10</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  AI has identified recurring patterns in crisis data across multiple regions
                </p>
                {/* <div className="flex items-center spa ce-x-2 text-sm">
                  <span className="text-green-600 font-medium">↑ 15%</span>
                  <span className="text-muted-foreground">from last month</span>
                </div> */}
              </div>

              {/* Secondary Cards */}
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="font-medium">Tweets Recognized</span>
                    </div>
                    <Badge variant="secondary" className="text-base px-2 py-1">10K</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Social media posts analyzed for crisis indicators
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Prediction Accuracy</span>
                    </div>
                    <Badge variant="secondary" className="text-base px-2 py-1">100%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI model accuracy in crisis prediction
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">Anomalies Detected</span>
                    </div>
                    <Badge variant="secondary" className="text-base px-2 py-1">3</Badge>
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
