'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, AlertTriangle, Activity, Target } from "lucide-react";

export default function AnalysisPage() {
  // Graph will show empty data for now, we'll add onto it once we obtain data
  const crisisData = [
    { month: 'Jan', highPriority: 0, mediumPriority: 0, totalIncidents: 0 },
    { month: 'Feb', highPriority: 0, mediumPriority: 0, totalIncidents: 0 },
    { month: 'Mar', highPriority: 0, mediumPriority: 0, totalIncidents: 0 },
    { month: 'Apr', highPriority: 0, mediumPriority: 0, totalIncidents: 0 },
    { month: 'May', highPriority: 0, mediumPriority: 0, totalIncidents: 0 },
    { month: 'Jun', highPriority: 0, mediumPriority: 0, totalIncidents: 0 },
    { month: 'Jul', highPriority: 0, mediumPriority: 0, totalIncidents: 0 },
    { month: 'Aug', highPriority: 0, mediumPriority: 0, totalIncidents: 0 },
    { month: 'Sep', highPriority: 0, mediumPriority: 0, totalIncidents: 0 },
    { month: 'Oct', highPriority: 0, mediumPriority: 0, totalIncidents: 0 },
    { month: 'Nov', highPriority: 0, mediumPriority: 0, totalIncidents: 0 },
    { month: 'Dec', highPriority: 0, mediumPriority: 0, totalIncidents: 0 }
  ];

  // Empty data for regional analysis - ready for real data integration
  const regionalData: { region: string; incidents: number; severity: string }[] = [];

  // This will contain empty heatmap data until we add onto it
  const generateHeatmapData = () => {
    const data = [];
    for (let i = 0; i < 8; i++) {
      const row = [];
      for (let j = 0; j < 12; j++) {
        row.push(0); // Values will be readjusted later when we obtain data
      }
      data.push(row);
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  // Get the intensity color for heatmap cells
  const getHeatmapColor = (intensity: number) => {
    // Return light gray for empty data
    return '#f3f4f6';
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
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Awaiting data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Awaiting data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Awaiting data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Awaiting data
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
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={crisisData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="highPriority" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={3}
                  name="High Priority"
                  dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mediumPriority" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Medium Priority"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalIncidents" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Total Incidents"
                  dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
                  <Badge variant="secondary">--</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-sm font-medium">Tweets Recognized</span>
                  </div>
                  <Badge variant="secondary">--</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Prediction Accuracy %</span>
                  </div>
                  <Badge variant="secondary">--</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
