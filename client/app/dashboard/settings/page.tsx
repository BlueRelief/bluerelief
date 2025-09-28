import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your BlueRelief platform preferences and notifications
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alert Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive crisis alerts via email
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get urgent alerts via SMS
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Browser push notifications for real-time updates
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alert-threshold">Alert Threshold</Label>
              <select 
                id="alert-threshold"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="critical">Critical Only</option>
                <option value="high">High and Above</option>
                <option value="medium" selected>Medium and Above</option>
                <option value="all">All Alerts</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Minimum severity level for notifications
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" placeholder="Doe" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input id="organization" placeholder="Emergency Response Team" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
            </div>
            
            <Button className="mt-4">Update Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>BlueSky API Status</Label>
                <p className="text-sm text-muted-foreground">
                  Connection to BlueSky social platform
                </p>
              </div>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Gemini AI Model</Label>
                <p className="text-sm text-muted-foreground">
                  AI analysis and processing engine
                </p>
              </div>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mapbox Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Geographic visualization service
                </p>
              </div>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
            
            <Button variant="outline" className="mt-4">Refresh Connections</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
