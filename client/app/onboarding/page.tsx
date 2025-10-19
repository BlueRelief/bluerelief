'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { Logo } from '@/components/logo';
import { checkAuthStatus } from '@/lib/auth';

export default function OnboardingPage() {
  const [step, setStep] = useState<'welcome' | 'location' | 'success'>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
        await saveLocation(location, latitude, longitude);
      },
      (err) => {
        setError('Failed to get your location. Try IP Location instead.');
        console.error(err);
        setLoading(false);
      }
    );
  };

  const handleIPLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://ip.radsoft.cloud/ip');
      const data = await response.json();

      if (data.status === 'success') {
        const { city, state, latitude, longitude } = data.details;
        const location = `${city}, ${state}`;
        await saveLocation(location, latitude, longitude);
      } else {
        setError('Failed to get location from IP');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to fetch IP location');
      console.error(err);
      setLoading(false);
    }
  };

  const saveLocation = async (location: string, lat: number, lon: number) => {
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
        setStep('success');
        
        // Wait a moment then refresh auth and redirect
        setTimeout(async () => {
          // Refresh auth to update user location in state
          await checkAuthStatus();
          // Hard refresh to ensure sidebar renders properly
          router.push('/dashboard');
          // Slight delay to ensure navigation completes before refresh
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
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
                    We'll send you instant alerts for emergencies within 100km of your location
                  </p>
                </div>
              </div>
            </div>

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
              <p className="text-muted-foreground">Choose how to share your location</p>
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

              <Button
                onClick={handleIPLocation}
                disabled={loading}
                variant="outline"
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
                    Use IP Location
                  </>
                )}
              </Button>
            </div>

            <Button
              onClick={() => setStep('welcome')}
              variant="ghost"
              className="w-full"
            >
              Back
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We use your location only to send relevant crisis alerts within 100km
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
                You'll now receive crisis alerts for your location
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
      </div>
    </div>
  );
}
