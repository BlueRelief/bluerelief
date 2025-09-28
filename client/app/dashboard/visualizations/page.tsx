import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VisualizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Visualizations</h1>
        <p className="text-muted-foreground">
          Interactive maps and charts powered by Mapbox and crisis data
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Global Crisis Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-4xl">🗺️</div>
                <p className="text-sm text-muted-foreground">Interactive Mapbox visualization</p>
                <p className="text-xs text-muted-foreground">Real-time crisis locations and affected areas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crisis Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-2xl">📊</div>
                <p className="text-sm text-muted-foreground">Crisis evolution over time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-2xl">📈</div>
                <p className="text-sm text-muted-foreground">Response time analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
