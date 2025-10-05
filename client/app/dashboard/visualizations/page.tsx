import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VisualizationsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Visualizations</h1>
        <p className="text-muted-foreground">
          Interactive data visualizations and charts
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced visualizations will be available here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
