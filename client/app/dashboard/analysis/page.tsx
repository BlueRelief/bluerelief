'use client';

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

  const regionalData: { region: string; incidents: number; severity: string }[] = [];

  // This will contain empty heatmap data until we add onto it
  const generateHeatmapData = () => {
    const data = [];
    for (let i = 0; i < 8; i++) {
      const row = [];
      for (let j = 0; j < 12; j++) {
        row.push(Math.random() * 0.8 + 0.1);
      }
      data.push(row);
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  const getHeatmapColor = (intensity: number) => {
    if (intensity < 0.3) return 'oklch(0.9683 0.0069 247.8956)';
    if (intensity < 0.5) return 'oklch(0.8091 0.0956 251.8128)';
    if (intensity < 0.7) return 'oklch(0.6128 0.1689 257.5652)';
    return 'oklch(0.5593 0.1942 258.4556)';
  };

  
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      default: return 'secondary';
    }
  };

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
            <div className="text-2xl font-bold">1,784</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">611</div>
            <p className="text-xs text-muted-foreground">
              34.3% of total incidents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.4%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2m</div>
            <p className="text-xs text-muted-foreground">
              -0.8m from last month
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

      {/* Heatmap and Regional Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Crisis Intensity Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Crisis Intensity Heatmap</CardTitle>
            <p className="text-sm text-muted-foreground">
              Geographic distribution of crisis intensity
            </p>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              {/* Heatmap Grid */}
              <div className="grid grid-cols-12 gap-1 mb-4">
                {heatmapData.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="aspect-square rounded-sm border border-border transition-all hover:scale-110 cursor-pointer"
                      style={{
                        backgroundColor: getHeatmapColor(cell),
                      }}
                      title={`Row ${rowIndex + 1}, Col ${colIndex + 1}: ${(cell * 100).toFixed(1)}%`}
                    />
                  ))
                )}
              </div>
              
              {/* Heatmap Legend */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <span>Crisis Intensity:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-muted"></div>
                    <span>Low</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-primary/60"></div>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-primary"></div>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Crisis distribution by geographic region
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regionalData.length > 0 ? (
                regionalData.map((region, index) => (
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
      </div>

      {/* Additional Analysis Cards */}
      <div className="flex justify-center">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Recognition</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-detected crisis patterns and anomalies
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-sm font-medium">Recurring Crisis Patterns</span>
                  </div>
                  <Badge variant="secondary">23</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-sm font-medium">Tweets Recognized</span>
                  </div>
                  <Badge variant="secondary">8.4K</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Prediction Accuracy %</span>
                  </div>
                  <Badge variant="secondary">87.3%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
