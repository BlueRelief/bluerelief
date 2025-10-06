"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Mock data for the data feeds
const dataFeeds = [
  {
    id: 1,
    name: "Emergency Services Feed",
    status: "active" as const,
    tweetsProcessed: 33,
    crisisDetected: 25,
    confidenceScore: 0,
    lastCrisis: "N/A",
  },
  {
    id: 2,
    name: "Data Monitoring",
    status: "active" as const,
    tweetsProcessed: 33,
    crisisDetected: 25,
    confidenceScore: 0,
    lastCrisis: "N/A",
  },
  {
    id: 3,
    name: "Social Media Monitoring",
    status: "active" as const,
    tweetsProcessed: 34,
    crisisDetected: 25,
    confidenceScore: 0,
    lastCrisis: "N/A",
  },
]

export default function DataFeedPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFeeds = dataFeeds.filter((feed) =>
    feed.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold text-foreground">Data Feed</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 transition-all duration-200 hover:bg-muted hover:scale-105">
                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors duration-200" />
                <span className="sr-only">Information about data feeds</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Data Feed Information</DialogTitle>
                <DialogDescription>
                  Learn about each data feed and how they help detect crises from BlueSky tweets.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-foreground">Emergency Services Feed</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitors updates from official emergency service accounts and verified first responders. 
                      Tracks real-time emergency calls, incident reports, and official crisis communications.
                    </p>
                  </div>
                
                  
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="font-semibold text-foreground">Data Monitoring</h3>
                    <p className="text-sm text-muted-foreground">
                      Tracks data related to the crisis, such as weather, individuals affected, and other relevant data.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-foreground">Social Media Monitoring</h3>
                    <p className="text-sm text-muted-foreground">
                      Analyzes public sentiment and crisis mentions across BlueSky. 
                      Uses AI to detect severe situations and verified reports from the BlueSky community.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Real-time Monitoring</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Each feed in BlueRelief continuously monitors Bluesky for crisis-related content using advanced keyword filtering, 
                    sentiment analysis, and tagging based off geographical region. Our custom AI model analyzes tweets with &gt;95% accuracy to detect 
                    potential crises with low hallucination, informing our website users in seconds and promoting better recovery.
                  </p>

                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex items-center space-x-4">

        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Feeds Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Feed Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Feed Name</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeeds.map((feed) => (
                  <TableRow key={feed.id}>
                    <TableCell>
                      <span className="font-medium">{feed.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          feed.status === "active"
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        {feed.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Overall Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Crisis Detection Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Total Tweets Processed */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tweets Processed</p>
                  <p className="text-2xl font-bold">
                    {dataFeeds.reduce((sum, feed) => sum + feed.tweetsProcessed, 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-4xl opacity-20">📊</div>
              </div>

              {/* Total Crises Detected */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Crises Detected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {dataFeeds.reduce((sum, feed) => sum + feed.crisisDetected, 0)}
                  </p>
                </div>
                <div className="text-4xl opacity-20">🚨</div>
              </div>

              {/* Last Crisis with Link */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Most Recent Crisis</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nepal Floods</p>
                    <p className="text-sm text-muted-foreground">October 2025</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://bsky.app/profile/emergency.bsky.social/post/3k7x2y9z8w1v', '_blank')}
                    className="flex items-center gap-2"
                  >
                    View Tweet
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Weekly Crisis Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Weekly Crisis Details</CardTitle>
          <p className="text-sm text-muted-foreground">Recent crisis events detected this week</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: 1,
                crisisName: "Flash Floods - Nepal",
                date: "2025-10-05",
                time: "00:00 CST",
                region: "Nepal",
                severity: "Critical",
                tweetsAnalyzed: 100,
                status: "Active",
                description: "Intense downpours and flash floods causing mass destruction in the country"
              },
              {
                id: 2,
                crisisName: "6.9 MagnitudeEarthquake - Philippines",
                date: "2025-10-01",
                time: "08:15 CST",
                region: "Cebu, Philippines",
                severity: "Critical",
                tweetsAnalyzed: 100,
                confidence: 89,
                status: "Ongoing",
                description: "Severe earthquake causing mass destruction in the country, with significant damage to infrastructure and multiple reported injuries"
              },
    
            ].map((crisis) => (
              <div key={crisis.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{crisis.crisisName}</h3>
                      <Badge 
                        variant="outline" 
                        className={
                          crisis.severity === "Critical" ? "border-red-500 text-red-600 bg-red-50" :
                          crisis.severity === "High" ? "border-orange-500 text-orange-600 bg-orange-50" :
                          "border-yellow-500 text-yellow-600 bg-yellow-50"
                        }
                      >
                        {crisis.severity}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={
                          crisis.status === "Ongoing" ? "border-blue-500 text-blue-600 bg-blue-50" :
                          crisis.status === "Contained" ? "border-yellow-500 text-yellow-600 bg-yellow-50" :
                          "border-green-500 text-green-600 bg-green-50"
                        }
                      >
                        {crisis.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{crisis.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">📍 Location:</span>
                    <p className="font-medium">{crisis.region}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">📅 Date:</span>
                    <p className="font-medium">{crisis.date} at {crisis.time}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">📊 Tweets:</span>
                    <p className="font-medium">{crisis.tweetsAnalyzed} analyzed</p>
                  </div>
                  <div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
