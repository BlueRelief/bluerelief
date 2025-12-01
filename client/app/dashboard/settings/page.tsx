"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Check, AlertCircle, Loader2, RefreshCw, Trash2, MapPin, Calendar, User, Edit2, X, Plus } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { MapStyleSettings } from "@/components/map-style-settings"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface WatchedRegion {
  name: string
  lat: number
  lng: number
  bounds?: {
    ne_lat: number
    ne_lng: number
    sw_lat: number
    sw_lng: number
  }
  place_id?: string
}

export default function SettingsPage() {
  const { user, loading, refreshAuth } = useAuth()
  const router = useRouter()
  const [emailNotifications, setEmailNotifications] = useState(false)

  // Alert preferences
  const [minSeverity, setMinSeverity] = useState(3)
  const [watchedRegions, setWatchedRegions] = useState<WatchedRegion[]>([])
  const [regionSearch, setRegionSearch] = useState('')
  const [searchingRegion, setSearchingRegion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [updatingLocation, setUpdatingLocation] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [updatingName, setUpdatingName] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const loadPreferences = useCallback(async () => {
    try {
      const response = await apiClient(`/api/alerts/preferences?user_id=${user?.user_id}`)
      if (response.ok) {
        const data = await response.json()
        setMinSeverity(data.min_severity || 3)
        setWatchedRegions(data.watched_regions || [])
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
          watched_regions: watchedRegions.length > 0 ? watchedRegions : null,
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

  const searchAndAddRegion = async () => {
    if (!regionSearch.trim()) return

    setSearchingRegion(true)
    try {
      const response = await apiClient(`/api/alerts/regions/search?query=${encodeURIComponent(regionSearch)}`)
      if (response.ok) {
        const region: WatchedRegion = await response.json()
        if (!watchedRegions.some(r => r.place_id === region.place_id)) {
          setWatchedRegions([...watchedRegions, region])
        }
        setRegionSearch('')
      } else {
        alert('Region not found. Try a different search term.')
      }
    } catch (err) {
      console.error('Failed to search region:', err)
      alert('Failed to search region')
    } finally {
      setSearchingRegion(false)
    }
  }

  const removeRegion = (index: number) => {
    setWatchedRegions(watchedRegions.filter((_, i) => i !== index))
  }

  const updateLocation = () => {
    router.push('/onboarding?from=settings')
  }

  const clearLocation = async () => {
    if (!user?.user_id) return

    if (!confirm('Are you sure you want to clear your location? You will receive global alerts instead of location-based alerts.')) {
      return
    }

    setUpdatingLocation(true)
    try {
      const response = await apiClient('/auth/setup-location', {
        method: 'POST',
        body: JSON.stringify({
          location: null,
          latitude: null,
          longitude: null,
        }),
      })

      if (response.ok) {
        await refreshAuth()
      } else {
        alert('Failed to clear location')
      }
    } catch (err) {
      console.error('Error clearing location:', err)
      alert('Error clearing location')
    } finally {
      setUpdatingLocation(false)
    }
  }

  const startEditingName = () => {
    setNameValue(user?.name || '')
    setEditingName(true)
  }

  const cancelEditingName = () => {
    setEditingName(false)
    setNameValue('')
  }

  const saveName = async () => {
    if (!user?.user_id || !nameValue.trim()) return

    setUpdatingName(true)
    try {
      const response = await apiClient('/auth/update-name', {
        method: 'PUT',
        body: JSON.stringify({
          name: nameValue.trim(),
        }),
      })

      if (response.ok) {
        await refreshAuth()
        setEditingName(false)
        setNameValue('')
      } else {
        const error = await response.json()
        alert(error.detail || 'Failed to update name')
      }
    } catch (err) {
      console.error('Error updating name:', err)
      alert('Error updating name')
    } finally {
      setUpdatingName(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user?.user_id) return

    setDeletingAccount(true)
    try {
      const response = await apiClient('/auth/delete-account', {
        method: 'DELETE',
      })

      if (response.ok) {
        // Clear auth state and redirect to home page
        // Use window.location to ensure full page reload and cookie clearing
        window.location.href = '/'
      } else {
        const error = await response.json()
        alert(error.detail || 'Failed to delete account')
        setDeletingAccount(false)
      }
    } catch (err) {
      console.error('Error deleting account:', err)
      alert('Error deleting account')
      setDeletingAccount(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-start">
        {/* Left Column: Profile and Map Style */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 flex-1">
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
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          className="flex-1"
                          placeholder="Enter your name"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              void saveName()
                            } else if (e.key === 'Escape') {
                              cancelEditingName()
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={saveName}
                          disabled={updatingName || !nameValue.trim()}
                        >
                          {updatingName ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditingName}
                          disabled={updatingName}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-lg">
                          {user?.name || "No name available"}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={startEditingName}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
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



            {/* Member Since and Role Section */}
            <div className="pt-3 border-t space-y-2">
              {user?.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Member since: {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              {user?.role && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Location Section */}
            <div className="pt-3 border-t">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Location</span>
                </div>
                {user?.latitude != null && user?.longitude != null ? (
                  <>
                    <div className="text-sm">
                      {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Alerts within 100km
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={updateLocation}
                        disabled={updatingLocation}
                        className="flex-1"
                      >
                        {updatingLocation ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Update Location
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearLocation}
                        disabled={updatingLocation}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Location
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      No location set
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={updateLocation}
                      disabled={updatingLocation}
                      className="w-full"
                    >
                      {updatingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          Set Location
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Email Notifications Section */}
            <div className="pt-4 border-t">
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
            </div>



            {/* Account Removal */}
            <div className="pt-3 border-t mt-auto">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-destructive">Account Removal</h3>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Style Settings */}
        <MapStyleSettings />
        </div>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Your profile information</li>
                  <li>Your alert preferences</li>
                  <li>Your location settings</li>
                  <li>All associated data</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deletingAccount}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert Preferences Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Alert Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1 space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm space-y-2">
                  <p className="font-semibold text-foreground">How alerts work</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <p>• <strong>Location-based:</strong> Alerts for disasters within 100km of your location</p>
                    <p>• <strong>Severity filter:</strong> Only alerts at or above your minimum severity</p>
                    <p>• <strong>Custom regions:</strong> Optionally add regions to get alerts from anywhere</p>
                    <p>• <strong>No location:</strong> Receive all global alerts</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-base font-semibold mb-3 block">Minimum Severity</Label>
              <Select value={String(minSeverity)} onValueChange={(value) => setMinSeverity(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low (1) - All alerts</SelectItem>
                  <SelectItem value="2">Medium (2) - Moderate and above</SelectItem>
                  <SelectItem value="3">High (3) - Serious alerts only</SelectItem>
                  <SelectItem value="4">Very High (4) - Critical only</SelectItem>
                  <SelectItem value="5">Critical (5) - Most severe only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Only disasters at this severity or higher will trigger alerts (both dashboard and email).
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold block">
                Watch Additional Regions (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Get alerts from these regions even if they&apos;re outside your 100km radius.
              </p>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Search for a region (e.g., California, Texas)"
                  value={regionSearch}
                  onChange={(e) => setRegionSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void searchAndAddRegion()
                    }
                  }}
                  className="text-sm"
                />
                <Button
                  onClick={searchAndAddRegion}
                  disabled={searchingRegion || !regionSearch.trim()}
                  size="sm"
                >
                  {searchingRegion ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {watchedRegions.length > 0 && (
                <div className="space-y-2">
                  {watchedRegions.map((region, index) => (
                    <div
                      key={region.place_id || index}
                      className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{region.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRegion(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t mt-auto">
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
      </div>
    </div>
  )
}