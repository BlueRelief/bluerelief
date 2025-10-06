"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Check } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, loading, isAuthenticated } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [autoUpdates, setAutoUpdates] = useState(false)
  const [allowTracking, setAllowTracking] = useState(true)
  const [shareUsageData, setShareUsageData] = useState(true)
  const [personalizedAds, setPersonalizedAds] = useState(true)

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            className="pl-9 bg-muted/50"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card - Fixed */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20" onClick={() => {
                    console.log("Avatar clicked:", user?.picture);
                  }}>
                <AvatarImage 
                  src={user?.picture} 
                  alt={user?.name || "User"} 
                />
                <AvatarFallback className="bg-muted text-2xl">
                  {user?.name 
                    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
                    : user?.user_email?.[0]?.toUpperCase() || "U"
                  }
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                {loading ? (
                  <>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </>
                ) : (
                  <>
                    <div className="font-medium text-lg">
                      {user?.name || "No name available"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user?.user_email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {user?.user_id}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-base font-normal">
                Email Notifications
              </Label>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="two-factor" className="text-base font-normal">
                Two-Factor Authentication
              </Label>
              <Switch
                id="two-factor"
                checked={twoFactor}
                onCheckedChange={setTwoFactor}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-updates" className="text-base font-normal">
                Auto Updates
              </Label>
              <Switch
                id="auto-updates"
                checked={autoUpdates}
                onCheckedChange={setAutoUpdates}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Card */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAllowTracking(!allowTracking)}
                className={`h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  allowTracking ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {allowTracking && <Check className="h-4 w-4" />}
              </button>
              <Label htmlFor="allow-tracking" className="text-base font-normal cursor-pointer" onClick={() => setAllowTracking(!allowTracking)}>
                Allow Tracking
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShareUsageData(!shareUsageData)}
                className={`h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  shareUsageData ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {shareUsageData && <Check className="h-4 w-4" />}
              </button>
              <Label htmlFor="share-usage-data" className="text-base font-normal cursor-pointer" onClick={() => setShareUsageData(!shareUsageData)}>
                Share Usage Data
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPersonalizedAds(!personalizedAds)}
                className={`h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  personalizedAds ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {personalizedAds && <Check className="h-4 w-4" />}
              </button>
              <Label htmlFor="personalized-ads" className="text-base font-normal cursor-pointer" onClick={() => setPersonalizedAds(!personalizedAds)}>
                Personalized Ads
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Theme Card */}
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setTheme("light")}
                className="h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center"
              >
                {theme === "light" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </button>
              <Label htmlFor="light" className="text-base font-normal cursor-pointer" onClick={() => setTheme("light")}>
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setTheme("dark")}
                className="h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center"
              >
                {theme === "dark" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </button>
              <Label htmlFor="dark" className="text-base font-normal cursor-pointer" onClick={() => setTheme("dark")}>
                Dark
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setTheme("system")}
                className="h-4 w-4 rounded-full border border-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center"
              >
                {theme === "system" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </button>
              <Label htmlFor="system" className="text-base font-normal cursor-pointer" onClick={() => setTheme("system")}>
                System
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}