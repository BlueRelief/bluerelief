"use client"

import { useEffect, useState } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { getDataFeedStatus, getDataFeedOverview, getWeeklyCrises } from "@/lib/api-client"

export default function DataFeedPage() {
  const [feedStatus, setFeedStatus] = useState<any>(null)
  const [overview, setOverview] = useState<any>(null)
  const [weeklyCrises, setWeeklyCrises] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [statusData, overviewData] = await Promise.all([
          getDataFeedStatus(),
          getDataFeedOverview()
        ])
        setFeedStatus(statusData)
        setOverview(overviewData)
      } catch (err: any) {
        setError(err.message)
      }
    }
    fetchInitialData()
  }, [])

  useEffect(() => {
    async function fetchCrises() {
      try {
        const crisesData = await getWeeklyCrises(7, currentPage, 10)
        setWeeklyCrises(crisesData.crises)
        setPagination(crisesData.pagination)
      } catch (err: any) {
        console.error('Error fetching crises:', err)
      }
    }
    fetchCrises()
  }, [currentPage])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Data Feed</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Error loading data</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
                  Learn about our Bluesky Crisis Monitor and how it helps detect crises from Bluesky posts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-foreground">Bluesky Crisis Monitor</h3>
                    <p className="text-sm text-muted-foreground">
                      Continuously monitors Bluesky for crisis-related content using advanced keyword filtering, 
                      sentiment analysis, and geographical tagging. Our AI model analyzes posts to detect 
                      earthquakes, floods, fires, and other disasters in real-time.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Real-time Monitoring</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    BlueRelief continuously scrapes Bluesky every minute for crisis-related posts. Our custom AI model 
                    extracts disaster information including location, severity, affected population, and disaster type. 
                    This enables us to inform website users within seconds and promote better disaster response and recovery.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {feedStatus?.feeds?.map((feed: any) => (
                  <TableRow key={feed.id}>
                    <TableCell>
                      <span className="font-medium">{feed.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={feed.status === "active" ? "default" : "secondary"}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Crisis Detection Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tweets Processed</p>
                  <p className="text-2xl font-bold">
                    {overview?.total_tweets_processed?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-4xl opacity-20">📊</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Crises Detected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {overview?.total_crises_detected || 0}
                  </p>
                </div>
                <div className="text-4xl opacity-20">🚨</div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Most Recent Crisis</p>
                {overview?.most_recent_crisis ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{overview.most_recent_crisis.name}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(overview.most_recent_crisis.date)}</p>
                    </div>
                    {overview.most_recent_crisis.bluesky_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(overview.most_recent_crisis.bluesky_url, '_blank')}
                        className="flex items-center gap-2"
                      >
                        View Post
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent crises detected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Weekly Crisis Details</CardTitle>
          <p className="text-sm text-muted-foreground">Recent crisis events detected this week</p>
        </CardHeader>
        <CardContent>
          {weeklyCrises.length > 0 ? (
            <div className="space-y-3">
              {weeklyCrises.map((crisis) => (
                <div key={crisis.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{crisis.crisis_name}</h3>
                    <Badge 
                      variant={
                        crisis.severity === "Critical" || crisis.severity === "High" 
                          ? "destructive" 
                          : "secondary"
                      }
                    >
                      {crisis.severity}
                    </Badge>
                    <Badge 
                      variant={
                        crisis.status === "Active" || crisis.status === "Ongoing"
                          ? "default"
                          : "outline"
                      }
                    >
                      {crisis.status}
                    </Badge>
                    {crisis.bluesky_url && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(crisis.bluesky_url, '_blank')}
                        className="ml-auto flex items-center gap-1"
                      >
                        View Post
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{crisis.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">📍 Location:</span>
                      <span className="font-medium">{crisis.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">📅 Date:</span>
                      <span className="font-medium">{formatDateTime(crisis.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">📊 Tweets:</span>
                      <span className="font-medium">{crisis.tweets_analyzed} analyzed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No crises detected in the past week</p>
          )}
          
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => pagination.has_prev && setCurrentPage(currentPage - 1)}
                      className={!pagination.has_prev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.total_pages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <PaginationItem key={pageNum}>
                          <span className="px-4">...</span>
                        </PaginationItem>
                      )
                    }
                    return null
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => pagination.has_next && setCurrentPage(currentPage + 1)}
                      className={!pagination.has_next ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
