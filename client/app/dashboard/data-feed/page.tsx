import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DataFeedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Feed</h1>
        <p className="text-muted-foreground">
          Real-time social media posts and crisis-related content
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live BlueSky Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="border-l-4 border-red-500 pl-4 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">@emergency_ca</p>
                <Badge variant="destructive">High Alert</Badge>
              </div>
              <p className="text-sm mt-1">Wildfire spreading rapidly near Highway 101. Evacuations ordered for zone 5.</p>
              <p className="text-xs text-muted-foreground mt-1">2 minutes ago • Confidence: 94%</p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">@texasweather</p>
                <Badge variant="secondary">Medium Alert</Badge>
              </div>
              <p className="text-sm mt-1">Flash flooding reported in downtown area. Multiple streets impassable.</p>
              <p className="text-xs text-muted-foreground mt-1">15 minutes ago • Confidence: 87%</p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">@nycgrid</p>
                <Badge variant="outline">Low Alert</Badge>
              </div>
              <p className="text-sm mt-1">Power outage affecting 3 blocks in Manhattan. Crews dispatched.</p>
              <p className="text-xs text-muted-foreground mt-1">32 minutes ago • Confidence: 76%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
