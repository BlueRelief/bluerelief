'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface LocationOnboardingProps {
  onLocationSet?: () => Promise<void> | void;
}

export function LocationOnboarding({ onLocationSet }: LocationOnboardingProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        // Call callback to refresh auth data
        console.log('Calling onLocationSet callback...');
        await onLocationSet?.();
        console.log('Callback completed');
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
        setLoading(false);
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
        await handleLocationSet(location, latitude, longitude);
      } else {
        setError('Failed to get location from IP');
      }
    } catch (err) {
      setError('Failed to fetch IP location');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <MapPin className="w-12 h-12 mx-auto text-blue-600" />
          <h2 className="text-2xl font-bold">Set Your Location</h2>
          <p className="text-gray-600">We need your location to send you relevant crisis alerts</p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleBrowserLocation}
            disabled={loading}
            variant="default"
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
                Share My Location
              </>
            )}
          </Button>

          <Button
            onClick={handleIPLocation}
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
                Use My IP Location
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Your location helps us send alerts for disasters within 100km of you
        </p>
      </Card>
    </div>
  );
}
