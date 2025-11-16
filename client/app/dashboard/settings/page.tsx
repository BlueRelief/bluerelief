"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Check, AlertCircle, Loader2, Sun, Moon, Monitor } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { MapStyleSettings } from "@/components/map-style-settings"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, loading } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [autoUpdates, setAutoUpdates] = useState(false)
  const [shareUsageData, setShareUsageData] = useState(true)

  // Alert preferences
  const [minSeverity, setMinSeverity] = useState(3)
  const [emailMinSeverity, setEmailMinSeverity] = useState(3)
  const [alertTypes, setAlertTypes] = useState(['new_crisis', 'severity_change', 'update'])
  const [regions, setRegions] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const loadPreferences = useCallback(async () => {
    try {
      const response = await apiClient(`/api/alerts/preferences?user_id=${user?.user_id}`)
      if (response.ok) {
        const data = await response.json()
        setMinSeverity(data.min_severity || 3)
        setEmailMinSeverity(data.email_min_severity || 3)
        setAlertTypes(data.alert_types || ['new_crisis', 'severity_change', 'update'])
        setRegions(data.regions?.join(', ') || '')
        setEmailNotifications(data.email_enabled || false)
      }
    } catch (err) {
      console.error('Failed to load preferences:', err)
    }
  }, [user?.user_id])

  // Load alert preferences on mount
  useEffect(() => {
    if (user?.user_id) {
      loadPreferences()
    }
  }, [user?.user_id, loadPreferences])

  const savePreferences = async (overrides?: { email_enabled?: boolean }) => {
    if (!user?.user_id) return

    setSaving(true)
    try {
      const response = await apiClient(`/api/alerts/preferences?user_id=${user.user_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          min_severity: minSeverity,
          email_min_severity: emailMinSeverity,
          alert_types: alertTypes,
          regions: regions ? regions.split(',').map(r => r.trim()).filter(r => r) : null,
          email_enabled: overrides?.email_enabled ?? emailNotifications,
        }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save preferences:', err)
    } finally {
      setSaving(false)
    }
  }

  const toggleAlertType = (type: string) => {
    setAlertTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

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
                {user?.picture && (
                  <AvatarImage 
                    src={user.picture} 
                    alt={user.name || "User"} 
                  />
                )}
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

        {/* Alert Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Alert Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Dashboard Alert Severity</Label>
              <Select value={String(minSeverity)} onValueChange={(value) => setMinSeverity(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low (1)</SelectItem>
                  <SelectItem value="2">Medium (2)</SelectItem>
                  <SelectItem value="3">High (3)</SelectItem>
                  <SelectItem value="4">Very High (4)</SelectItem>
                  <SelectItem value="5">Critical (5)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">Show alerts in dashboard at this severity level or higher</p>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">Email Alert Severity</Label>
              <Select value={String(emailMinSeverity)} onValueChange={(value) => setEmailMinSeverity(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low (1)</SelectItem>
                  <SelectItem value="2">Medium (2)</SelectItem>
                  <SelectItem value="3">High (3)</SelectItem>
                  <SelectItem value="4">Very High (4)</SelectItem>
                  <SelectItem value="5">Critical (5)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">Only send emails for alerts at this severity level or higher</p>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">Alert Types</Label>
              <div className="space-y-2">
                {['new_crisis', 'severity_change', 'update'].map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={alertTypes.includes(type)}
                      onCheckedChange={() => toggleAlertType(type)}
                    />
                    <Label htmlFor={type} className="font-normal cursor-pointer text-sm">
                      {type === 'new_crisis' ? 'New Crisis' : type === 'severity_change' ? 'Severity Change' : 'Updates'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="regions" className="text-base font-semibold mb-2 block">
                Regions (Optional)
              </Label>
              <Input
                id="regions"
                placeholder="e.g., Texas, California, New York"
                value={regions}
                onChange={(e) => setRegions(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">Comma-separated list. Leave empty to get alerts based on location radius.</p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => savePreferences()}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
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
              <div className="flex-1">
                <Label htmlFor="email-notifications" className="text-base font-normal">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive email alerts for crises in your area
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={(checked) => {
                  setEmailNotifications(checked)
                  void savePreferences({ email_enabled: checked })
                }}
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
            <div className="flex items-center space-x-3">
              <Checkbox
                id="share-usage-data"
                checked={shareUsageData}
                onCheckedChange={(checked) => setShareUsageData(checked as boolean)}
              />
              <Label htmlFor="share-usage-data" className="text-base font-normal cursor-pointer">
                Share Usage Data
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
              <input
                type="radio"
                name="theme"
                value="light"
                id="light"
                checked={theme === "light"}
                onChange={() => setTheme("light")}
                className="h-4 w-4"
              />
              <Label htmlFor="light" className="text-base font-normal cursor-pointer flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                name="theme"
                value="dark"
                id="dark"
                checked={theme === "dark"}
                onChange={() => setTheme("dark")}
                className="h-4 w-4"
              />
              <Label htmlFor="dark" className="text-base font-normal cursor-pointer flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Dark
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                name="theme"
                value="system"
                id="system"
                checked={theme === "system"}
                onChange={() => setTheme("system")}
                className="h-4 w-4"
              />
              <Label htmlFor="system" className="text-base font-normal cursor-pointer flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                System
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Map Style Settings */}
        <MapStyleSettings />
      </div>
    </div>
  )
}