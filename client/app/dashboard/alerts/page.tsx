"use client"

import { useState } from "react";
import { Search, ExternalLink, Calendar, MapPin, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface BlueskyPost {
  id: string;
  author: string;
  handle: string;
  timestamp: string;
  url: string;
  location?: string;
}

interface Alert {
  id: string;
  type: "TORNADO" | "HURRICANE" | "EARTHQUAKE" | "FLOOD";
  severity: "high" | "medium";
  timestamp: string;
  timeAgo: string;
  location: string;
  blueskyPost: BlueskyPost;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "TORNADO",
    severity: "high",
    timestamp: "2025-10-10T14:30:00Z",
    timeAgo: "2 minutes ago",
    location: "Oklahoma City, OK",
    blueskyPost: {
      id: "bsky-1",
      author: "Jane Doe",
      handle: "@janed.weather",
      timestamp: "2025-10-10T14:30:00Z",
      url: "https://bsky.app/profile/sarahj.weather/post/3k7x2y8z",
      location: "Oklahoma City, OK"
    }
  },
  {
    id: "2", 
    type: "TORNADO",
    severity: "medium",
    timestamp: "2025-10-10T14:30:00Z",
    timeAgo: "20 minutes ago",
    location: "Houston, TX",
    blueskyPost: {
      id: "bsky-2",
      author: "John Doe",
      handle: "@johnd.weather",
      timestamp: "2025-10-10T14:30:00Z",
      url: "https://bsky.app",
      location: "Houston, TX"
    }
  },
  {
    id: "3",
    type: "HURRICANE", 
    severity: "high",
    timestamp: "2025-10-10T14:30:00Z",
    timeAgo: "1 hour ago",
    location: "Miami, FL",
    blueskyPost: {
      id: "bsky-3",
      author: "National Weather Service",
      handle: "@nws.miami",
      timestamp: "2025-10-10T14:30:00Z",
      url: "https://bsky.app",
      location: "Miami, FL"
    }
  }
];

export default function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [alerts] = useState<Alert[]>(mockAlerts);

  const filteredAlerts = alerts.filter(alert =>
    alert.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAlertIcon = (severity: "high" | "medium") => {
    if (severity === "high") {
      return (
        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">!</span>
        </div>
      );
    } else {
      return (
        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-black font-bold text-lg">!</span>
        </div>
      );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground mt-1">Real-time crisis detection from Bluesky</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-80 bg-card border-border"
          />
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-6">
        {filteredAlerts.map((alert) => (
          <Card key={alert.id} className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start space-x-4">
                {getAlertIcon(alert.severity)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-2xl font-bold text-card-foreground uppercase tracking-wide">
                        {alert.type}
                      </h3>
                      <Badge 
                        variant={alert.severity === "high" ? "destructive" : "secondary"}
                        className="text-sm px-3 py-1"
                      >
                        {alert.severity === "high" ? "High Risk" : "Medium Risk"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.timeAgo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">{alert.location}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <Separator className="mx-6" />
            
            <CardContent className="pt-6">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm text-foreground">{alert.blueskyPost.author}</span>
                    <span className="text-sm text-muted-foreground">{alert.blueskyPost.handle}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(alert.blueskyPost.timestamp)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs">{alert.blueskyPost.location}</span>
                  </div>
                  <a 
                    href={alert.blueskyPost.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    <span>View Post on Bluesky</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No alerts found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms or check back later for new alerts.</p>
        </div>
      )}
    </div>
  );
}
