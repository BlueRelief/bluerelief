'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, CheckCircle2, Loader2, Search, Globe, Bell, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { Logo } from '@/components/logo';
import { checkAuthStatus } from '@/lib/auth';
import { useAuth } from '@/hooks/use-auth';

function OnboardingPageContent() {
  const searchParams = useSearchParams();
  const fromSettings = searchParams.get('from') === 'settings';
  const [step, setStep] = useState<'welcome' | 'location' | 'alerts' | 'success'>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState('');
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Alert preferences state
  const [minSeverity, setMinSeverity] = useState(3);
  const [savingAlerts, setSavingAlerts] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();

  // Skip to location step if coming from settings
  useEffect(() => {
    if (fromSettings) {
      setStep('location');
    }
  }, [fromSettings]);

  const handleBrowserLocation = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        await saveLocation(location, latitude, longitude, 'device');
      },
      (err) => {
        setError('Failed to get your location. Please try entering it manually.');
        console.error(err);
        setLoading(false);
      }
    );
  };

  const handleManualLocation = async () => {
    if (!manualLocation.trim()) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient(`/auth/geocode?query=${encodeURIComponent(manualLocation.trim())}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Location not found. Please try a different location.');
        } else {
          setError('Failed to find location. Please try again.');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.latitude && data.longitude) {
        const locationName = data.name || manualLocation;
        await saveLocation(locationName, data.latitude, data.longitude, 'manual');
      } else {
        setError('Location not found. Please try a different location.');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to find location. Please check your input and try again.');
      console.error(err);
      setLoading(false);
    }
  };

  const handleSkipLocation = () => {
    setShowSkipDialog(true);
  };

  const confirmSkipLocation = async () => {
    setShowSkipDialog(false);
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient('/auth/setup-location', {
        method: 'POST',
        body: JSON.stringify({
          location: null,
          latitude: null,
          longitude: null,
        }),
      });

      if (response.ok) {
        setSuccessMessage('You\'ll receive alerts for all global disasters');
        setStep('success');
        
        setTimeout(async () => {
          await checkAuthStatus();
          if (fromSettings) {
            router.push('/dashboard/settings');
          } else {
            router.push('/dashboard');
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 500);
          }
        }, 1500);
        setStep('alerts');
        setLoading(false);
      } else {
        setError('Failed to skip location setup');
        setLoading(false);
      }
    } catch (err) {
      setError('Error skipping location setup');
      console.error(err);
      setLoading(false);
    }
  };

  const saveLocation = async (location: string, lat: number, lon: number, method: 'device' | 'manual') => {
    try {
      const response = await apiClient('/auth/setup-location', {
        method: 'POST',
        body: JSON.stringify({
          location,
          latitude: lat,
          longitude: lon,
        }),
      });

      if (response.ok) {
        setStep('alerts');
        setLoading(false);
      } else {
        setError('Failed to save location');
        setLoading(false);
      }
    } catch (err) {
      setError('Error saving location');
      console.error(err);
      setLoading(false);
    }
  };

  const saveAlertPreferences = async () => {
    if (!user?.user_id) return;

    setSavingAlerts(true);
    try {
      const response = await apiClient(`/api/alerts/preferences?user_id=${user.user_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          min_severity: minSeverity,
          watched_regions: null,
          email_enabled: true,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Your preferences have been saved!');
        setStep('success');
        
        setTimeout(async () => {
          await checkAuthStatus();
          if (fromSettings) {
            router.push('/dashboard/settings');
          } else {
            router.push('/dashboard');
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 500);
          }
        }, 1500);
      } else {
        setError('Failed to save alert preferences');
        setSavingAlerts(false);
      }
    } catch (err) {
      setError('Error saving alert preferences');
      console.error(err);
      setSavingAlerts(false);
    }
  };

  const skipAlertPreferences = async () => {
    await saveAlertPreferences();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === 'welcome' && (
          <Card className="p-8 space-y-6 shadow-xl">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <Logo size="lg" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Welcome to BlueRelief</h1>
              <p className="text-muted-foreground">
                Get real-time crisis alerts for your location
              </p>
            </div>

            <div className="space-y-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div className="text-sm space-y-2">
                  <p className="font-semibold text-foreground">Location-Based Alerts</p>
                  <p className="text-muted-foreground">
                    We&apos;ll send you instant alerts for emergencies within 100km of your location
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              You can always update your location later in Settings
            </p>

            <Button
              onClick={() => setStep('location')}
              size="lg"
              className="w-full h-12 text-base"
            >
              Set Your Location
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your location is only used to filter relevant crisis alerts. We never share it with third parties.
            </p>
          </Card>
        )}

        {step === 'location' && (
          <Card className="p-8 space-y-6 shadow-xl">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Set Your Location</h2>
              <p className="text-muted-foreground">Choose how to set your location</p>
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleBrowserLocation}
                disabled={loading}
                variant="default"
                size="lg"
                className="w-full h-12 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Use Device Location
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter city, address, or location"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      handleManualLocation();
                    }
                  }}
                  className="w-full"
                />
                <Button
                  onClick={handleManualLocation}
                  disabled={loading || !manualLocation.trim()}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Enter Location Manually
                    </>
                  )}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-center text-muted-foreground px-4">
                  Some users only want global disaster alerts
                </p>
                <Button
                  onClick={handleSkipLocation}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-base"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Skip Location Setup
                </Button>
              </div>
            </div>

            <Button
              onClick={() => setStep('welcome')}
              variant="ghost"
              className="w-full"
            >
              Back
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You can always update your location later in Settings
            </p>
          </Card>
        )}

        {step === 'alerts' && (
          <Card className="p-8 space-y-6 shadow-xl">
            <div className="text-center space-y-2">
              <Bell className="w-12 h-12 mx-auto text-blue-600" />
              <h2 className="text-2xl font-bold text-foreground">Set Alert Preferences</h2>
              <p className="text-muted-foreground">Customize what alerts you want to receive</p>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-foreground">How alerts work</p>
                    <p className="text-muted-foreground">
                      You&apos;ll receive alerts based on your location (within 100km) and severity preferences. 
                      You can customize these settings anytime in Settings.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Minimum Alert Severity</Label>
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
                  Only show alerts at this severity level or higher in your dashboard
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  onClick={saveAlertPreferences}
                  disabled={savingAlerts}
                  size="lg"
                  className="w-full h-12 text-base"
                >
                  {savingAlerts ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue to Dashboard
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                <Button
                  onClick={skipAlertPreferences}
                  disabled={savingAlerts}
                  variant="outline"
                  className="w-full"
                >
                  Use Default Settings
                </Button>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              You can change these preferences anytime in Settings
            </p>
          </Card>
        )}

        {step === 'success' && (
          <Card className="p-8 space-y-6 shadow-xl">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">All Set!</h2>
              <p className="text-muted-foreground">
                {successMessage || 'You\'ll now receive crisis alerts for your location'}
              </p>
              <div className="pt-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to dashboard...
                </div>
              </div>
            </div>
          </Card>
        )}

        <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skip Location Setup?</DialogTitle>
              <DialogDescription>
                If you skip location setup, you&apos;ll receive alerts for all global disasters regardless of location.
                You can always set your location later in Settings.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSkipDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSkipLocation}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Skip Location Setup'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </Card>
          </div>
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}
