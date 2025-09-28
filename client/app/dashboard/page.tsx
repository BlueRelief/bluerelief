import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  TrendingUp, 
  Globe, 
  Activity 
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of current crisis detection and monitoring status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Posts Analyzed
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24,583</div>
            <p className="text-xs text-muted-foreground">
              +1,250 in last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Accuracy Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.8%</div>
            <p className="text-xs text-muted-foreground">
              +0.2% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Global Coverage
            </CardTitle>
            <Globe className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">
              Countries monitored
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Wildfire detected in California</p>
                <p className="text-xs text-muted-foreground">2 minutes ago • High severity</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Flooding reports in Texas</p>
                <p className="text-xs text-muted-foreground">15 minutes ago • Medium severity</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Power outage in New York</p>
                <p className="text-xs text-muted-foreground">32 minutes ago • Low severity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Model Status</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Online
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">BlueSky API</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Connected
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Data Processing</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Active
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Alert System</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Operational
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
