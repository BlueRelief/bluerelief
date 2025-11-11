"use client"

import { useEffect, useState } from "react"
import { Info, Activity, TrendingUp, Clock, RefreshCw, ExternalLink } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SentimentBadge } from "@/components/sentiment-badge"
import { BlueskyIcon } from "@/components/bluesky-icon"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
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
  sentiment?: string | null
  sentiment_score?: number | null
}

interface PaginationData {
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
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true)
        const [statusData, overviewData] = await Promise.all([
          getDataFeedStatus(),
          getDataFeedOverview()
        ])
        setFeedStatus(statusData)
        setOverview(overviewData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
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

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Data Feed</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="text-lg font-semibold">Error loading data</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Feed</h1>
          <p className="text-muted-foreground mt-1">
            Real-time crisis detection from Bluesky social media
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <RefreshCw className="h-4 w-4" onClick={() => window.location.reload()} />
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Activity className="h-4 w-4" />
                  <span>Posts Analyzed</span>
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-3xl font-bold">
                    {overview?.total_tweets_processed?.toLocaleString() || 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">From Bluesky feeds</p>
              </div>
              <BlueskyIcon className="text-[#1185fe]" size={48} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Crises Detected</span>
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold text-destructive">
                    {overview?.total_crises_detected || 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Active events</p>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <span>System Status</span>
                </div>
                {loading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <Badge className="!bg-green-500 !text-white text-sm">
                    ● Operational
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mt-1">All feeds running</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feed Status Section - Redesigned */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BlueskyIcon className="text-[#1185fe]" size={20} />
                Active Data Feeds
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Monitoring {feedStatus?.feeds?.length || 0} social media feed
                {(feedStatus?.feeds?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : feedStatus?.feeds && feedStatus.feeds.length > 0 ? (
            <div className="space-y-3">
              {feedStatus.feeds.map((feed) => (
                <div 
                  key={feed.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      feed.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                    }`} />
                    <div>
                      <p className="font-medium">{feed.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Last run: {formatRelativeTime(feed.last_run)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={feed.status === "active" ? "default" : "secondary"}>
                    {feed.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <BlueskyIcon className="text-muted-foreground mx-auto mb-4" size={48} />
              <p className="text-sm font-medium text-muted-foreground">No feeds configured</p>
              <p className="text-xs text-muted-foreground mt-1">
                Data feeds will appear here once configured
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crisis Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recent Crisis Events
            <Badge variant="secondary" className="ml-2">
              {pagination?.total_count || 0} total
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Events detected in the past 7 days from Bluesky posts
          </p>
        </CardHeader>
        <CardContent>
          {weeklyCrises.length > 0 ? (
            <div className="space-y-4">
              {weeklyCrises.map((crisis) => (
                <div 
                  key={crisis.id} 
                  className="group p-5 border rounded-lg hover:border-primary/50 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <Badge variant="outline" className="mt-0.5 capitalize">
                          {crisis.disaster_type}
                        </Badge>
                        <h3 className="font-semibold text-lg leading-tight">
                          {crisis.crisis_name}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {crisis.description}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge 
                        variant={
                          crisis.severity === "Critical" || crisis.severity === "High" 
                            ? "destructive" 
                            : "secondary"
                        }
                      >
                        {crisis.severity}
                      </Badge>
                      {crisis.sentiment && (
                        <SentimentBadge
                          sentiment={crisis.sentiment}
                          sentiment_score={crisis.sentiment_score}
                          showLabel={false}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">📍</span>
                        <span>{crisis.region}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">🕒</span>
                        <span>{formatDateTime(crisis.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">📊</span>
                        <span>{crisis.tweets_analyzed} posts</span>
                      </div>
                    </div>
                    {crisis.bluesky_url && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => window.open(crisis.bluesky_url!, '_blank')}
                      >
                        <BlueskyIcon className="mr-2 text-[#1185fe]" size={16} />
                        View on Bluesky
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <div className="text-6xl mb-4">📡</div>
              <p className="text-lg font-medium text-muted-foreground">No crises detected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crisis events will appear here as they're detected from Bluesky
              </p>
            </div>
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
