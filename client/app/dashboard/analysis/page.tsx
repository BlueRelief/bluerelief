import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analysis</h1>
        <p className="text-muted-foreground">
          Advanced AI analysis and trend detection for crisis patterns
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Negative (Crisis)</span>
                  <span>68%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{width: '68%'}}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Neutral (Informative)</span>
                  <span>24%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-gray-500 h-2 rounded-full" style={{width: '24%'}}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Positive (Support)</span>
                  <span>8%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '8%'}}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crisis Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Natural Disasters</span>
                <span className="text-sm font-medium">45%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Infrastructure</span>
                <span className="text-sm font-medium">28%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Public Safety</span>
                <span className="text-sm font-medium">15%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Health Emergency</span>
                <span className="text-sm font-medium">12%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
