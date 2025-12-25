'use client';

import { useState } from 'react';
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
import { MapPin, Loader2, Search, Globe } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface LocationOnboardingProps {
  onLocationSet?: () => Promise<void> | void;
}

export function LocationOnboarding({ onLocationSet }: LocationOnboardingProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState('');
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  const handleLocationSet = async (location: string, lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Saving location:', { location, lat, lon });
      const response = await apiClient('/auth/setup-location', {
        method: 'POST',
        body: JSON.stringify({
          location,
          latitude: lat,
          longitude: lon,
        }),
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Location saved successfully:', data);
        await onLocationSet?.();
      } else {
        const errorText = await response.text();
        console.error('Failed to save location:', response.status, errorText);
        setError('Failed to save location');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error saving location:', err);
      setError('Error saving location');
      setLoading(false);
    }
  };

  const handleIPLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const cached = localStorage.getItem('user_country_center');
      let longitude: number;
      let latitude: number;
      let locationName: string;

      if (cached) {
        const parsed = JSON.parse(cached);
        [longitude, latitude] = parsed;
        const cachedCountry = localStorage.getItem('user_country_name');
        locationName = cachedCountry || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        await handleLocationSet(locationName, latitude, longitude);
        return;
      }

      const ipResponse = await fetch('https://ip.radsoft.cloud/ip');
      if (!ipResponse.ok) {
        throw new Error('Failed to get IP location');
      }

      const ipData = await ipResponse.json();
      const country = ipData.details?.country;

      if (!country) {
        throw new Error('Could not determine country from IP');
      }

      const geoResponse = await apiClient(`/auth/geocode?query=${encodeURIComponent(country)}`);

      if (!geoResponse.ok) {
        throw new Error('Failed to geocode country');
      }

      const geoData = await geoResponse.json();
      if (geoData.latitude && geoData.longitude) {
        latitude = geoData.latitude;
        longitude = geoData.longitude;
        locationName = geoData.name || country;
        localStorage.setItem('user_country_center', JSON.stringify([longitude, latitude]));
        localStorage.setItem('user_country_name', locationName);
        await handleLocationSet(locationName, latitude, longitude);
      } else {
        throw new Error('Country location not found');
      }
    } catch (err) {
      setError('Failed to detect location from IP. Please try another method.');
      console.error(err);
      setLoading(false);
    }
  };

  const handleBrowserLocation = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        handleLocationSet(location, latitude, longitude);
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
        if (response.status === 403) {
          // Showcase mode - geocoding disabled
          setError('Manual location search is currently unavailable. Please use "Auto-Detect Country" or "Skip Location Setup" instead.');
        } else if (response.status === 404) {
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
        await handleLocationSet(locationName, data.latitude, data.longitude);
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
        await onLocationSet?.();
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

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="text-center space-y-2">
            <MapPin className="w-12 h-12 mx-auto text-blue-600" />
            <h2 className="text-2xl font-bold">Set Your Location</h2>
            <p className="text-muted-foreground">Choose how to set your location for personalized alerts</p>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleIPLocation}
              disabled={loading}
              variant="default"
              className="w-full h-12 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Detecting location...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Auto-Detect Country (via IP)
                </>
              )}
            </Button>

            <Button
              onClick={handleBrowserLocation}
              disabled={loading}
              variant="outline"
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
                  Use Precise Device Location
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
                className="w-full h-12 text-base"
              >
                <Globe className="w-4 h-4 mr-2" />
                Skip Location Setup
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can always update your location later in Settings
          </p>
        </Card>
      </div>

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
    </>
  );
}
