import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Eye, Archive } from "lucide-react";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alerts</h1>
        <p className="text-muted-foreground">
          Manage and respond to crisis alerts and notifications
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-500" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 border-l-4 border-red-500 rounded-r">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Critical</Badge>
                  <span className="font-medium">California Wildfire Escalation</span>
                </div>
                <p className="text-sm text-muted-foreground">Fire has crossed Highway 101, immediate evacuation required for zones 5-8</p>
                <p className="text-xs text-muted-foreground">Detected 2 minutes ago • Confidence: 96%</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">High</Badge>
                  <span className="font-medium">Texas Flash Flooding</span>
                </div>
                <p className="text-sm text-muted-foreground">Downtown area experiencing severe flooding, multiple street closures</p>
                <p className="text-xs text-muted-foreground">Detected 15 minutes ago • Confidence: 89%</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Medium</Badge>
                  <span className="font-medium">NYC Power Outage</span>
                </div>
                <p className="text-sm text-muted-foreground">Manhattan blocks 42-45 without power, repair crews deployed</p>
                <p className="text-xs text-muted-foreground">Detected 32 minutes ago • Confidence: 78%</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Alert Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Critical Alerts Today</span>
                  <span className="text-lg font-bold text-red-600">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">High Priority Alerts</span>
                  <span className="text-lg font-bold text-orange-600">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Medium Priority</span>
                  <span className="text-lg font-bold text-yellow-600">15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Active</span>
                  <span className="text-lg font-bold">26</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Acknowledged</span>
                  <span className="text-lg font-bold text-blue-600">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">In Progress</span>
                  <span className="text-lg font-bold text-purple-600">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Resolved</span>
                  <span className="text-lg font-bold text-green-600">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Response</span>
                  <span className="text-lg font-bold">4.2min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
