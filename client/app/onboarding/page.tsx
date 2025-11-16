'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, CheckCircle2, Loader2, Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

function OnboardingPageContent() {
  const searchParams = useSearchParams();
  const fromSettings = searchParams.get('from') === 'settings';
  const [step, setStep] = useState<'welcome' | 'location' | 'success'>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState('');
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

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
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!mapboxToken) {
        setError('Geocoding service not configured');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(manualLocation)}.json?access_token=${mapboxToken}&limit=1`
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [longitude, latitude] = feature.center;
        const locationName = feature.place_name || manualLocation;
        await saveLocation(locationName, latitude, longitude, 'manual');
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
        const methodText = method === 'device' ? 'device location' : 'manual entry';
        setSuccessMessage(`Location set using ${methodText}`);
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
        setError('Failed to save location');
        setLoading(false);
      }
    } catch (err) {
      setError('Error saving location');
      console.error(err);
      setLoading(false);
    }
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
