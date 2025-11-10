"use client"

import { useEffect, useState } from "react"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { getDataFeedStatus, getDataFeedOverview, getWeeklyCrises } from "@/lib/api-client"

interface Feed {
  id: number
  name: string
  status: string
  last_run: string | null
  next_run: string | null
}

interface MostRecentCrisis {
  name: string
  date: string
  bluesky_url: string | null
  severity: string
}

interface Overview {
  total_tweets_processed: number
  total_crises_detected: number
  most_recent_crisis: MostRecentCrisis | null
}

interface Crisis {
  id: number
  crisis_name: string
  date: string
  region: string
  severity: string
  tweets_analyzed: number
  status: string
  description: string
  disaster_type: string
  bluesky_url: string | null
}

interface Pagination {
  page: number
  page_size: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export default function DataFeedPage() {
  const [feedStatus, setFeedStatus] = useState<{ feeds: Feed[] } | null>(null)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [weeklyCrises, setWeeklyCrises] = useState<Crisis[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
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
      } catch (err) {
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  Total Posts Analyzed
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Total number of Bluesky social media posts processed and analyzed by the system for crisis indicators</p>
                    </TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold">
                  {overview?.total_tweets_processed?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-4xl opacity-30">📊</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  Crises Detected
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Total number of crisis events identified by analyzing Bluesky posts with AI-powered detection algorithms</p>
                    </TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold text-destructive">
                  {overview?.total_crises_detected || 0}
                </p>
              </div>
              <div className="text-4xl opacity-30">🚨</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  Feed Status
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Real-time status of all data collection feeds. Active means continuously monitoring and processing new posts.</p>
                    </TooltipContent>
                  </Tooltip>
                </p>
                <Badge className="bg-green-500 text-white">Active</Badge>
              </div>
              <div className="text-4xl opacity-30">✅</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feed Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed Status Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Feed Status
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Shows the operational status of each data collection feed including last run time and next scheduled run</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <p className="text-sm text-muted-foreground">Monitor data collection feeds</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {feedStatus?.feeds?.map((feed) => (
                <div key={feed.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-sm">{feed.name}</span>
                  <Badge
                    variant={feed.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {feed.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Recent Crisis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Latest Crisis
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>The most recently detected crisis event with severity level and link to original Bluesky post</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <p className="text-sm text-muted-foreground">Most recently detected event</p>
          </CardHeader>
          <CardContent>
            {overview?.most_recent_crisis ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">{overview.most_recent_crisis.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{formatDate(overview.most_recent_crisis.date)}</p>
                  <Badge className="mt-3 bg-destructive text-white">{overview.most_recent_crisis.severity}</Badge>
                </div>
                {overview.most_recent_crisis.bluesky_url && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => overview.most_recent_crisis?.bluesky_url && window.open(overview.most_recent_crisis.bluesky_url, '_blank')}
                  >
                    View on Bluesky
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.593-.218 1.267-.218 2.018 0 .751.08 1.425.218 2.018-.14-.017-.279-.036-.415-.056-2.67-.296-5.568.628-6.383 3.364C.378 21.729 0 26.689 0 27.377c0 .688.139 1.86.902 2.203.659.299 1.664.621 4.3-1.24C7.954 26.397 10.913 22.458 12 20.344c1.087 2.114 4.046 6.053 6.798 7.995 2.636 1.861 3.641 1.539 4.3 1.24.763-.343.902-1.515.902-2.203 0-.688-.378-5.648-.624-6.477-.815-2.736-3.713-3.66-6.383-3.364-.136.02-.275.039-.415.056.138-.593.218-1.267.218-2.018 0-.751-.08-1.425-.218-2.018.14.017.279.036.415.056 2.67.296 5.568-.628 6.383-3.364.246-.829.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8z"/>
                    </svg>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No recent crises detected</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Crisis Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Weekly Crisis Details
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>Complete list of all crisis events detected in the past week with details on location, type, severity, and analyzed tweets</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Recent crisis events detected this week</p>
        </CardHeader>
        <CardContent>
          {weeklyCrises.length > 0 ? (
            <div className="space-y-3">
              {weeklyCrises.map((crisis) => (
                <div key={crisis.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{crisis.crisis_name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{crisis.description}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Badge 
                        variant={
                          crisis.severity === "Critical" || crisis.severity === "High" 
                            ? "destructive" 
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {crisis.severity}
                      </Badge>
                      <Badge 
                        variant={
                          crisis.status === "Active" || crisis.status === "Ongoing"
                            ? "default"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {crisis.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground text-xs">📍 Location</span>
                      <p className="font-medium">{crisis.region}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground text-xs">📅 Date</span>
                      <p className="font-medium">{formatDateTime(crisis.date)}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground text-xs">📊 Posts</span>
                      <p className="font-medium">{crisis.tweets_analyzed}</p>
                    </div>
                    {crisis.bluesky_url && (
                      <div className="flex items-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => crisis.bluesky_url && window.open(crisis.bluesky_url, '_blank')}
                        >
                          View Post
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.593-.218 1.267-.218 2.018 0 .751.08 1.425.218 2.018-.14-.017-.279-.036-.415-.056-2.67-.296-5.568.628-6.383 3.364C.378 21.729 0 26.689 0 27.377c0 .688.139 1.86.902 2.203.659.299 1.664.621 4.3-1.24C7.954 26.397 10.913 22.458 12 20.344c1.087 2.114 4.046 6.053 6.798 7.995 2.636 1.861 3.641 1.539 4.3 1.24.763-.343.902-1.515.902-2.203 0-.688-.378-5.648-.624-6.477-.815-2.736-3.713-3.66-6.383-3.364-.136.02-.275.039-.415.056.138-.593.218-1.267.218-2.018 0-.751-.08-1.425-.218-2.018.14.017.279.036.415.056 2.67.296 5.568-.628 6.383-3.364.246-.829.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8z"/>
                          </svg>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">No crises detected in the past week</p>
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
