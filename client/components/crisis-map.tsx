"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Map, { Marker, Popup, NavigationControl, MapRef } from "react-map-gl/mapbox";
import { useTheme } from "next-themes";
import "mapbox-gl/dist/mapbox-gl.css";

interface RegionData {
  region: string;
  incidents: number;
  severity: string;
  coordinates: [number, number];
}

interface CrisisMapProps {
  regions: RegionData[];
  focusRegion?: string;
  onMapError?: (error: Error) => void;
}

const REGION_CENTERS: Record<string, { longitude: number; latitude: number; zoom: number }> = {
  "all": { longitude: 20, latitude: 20, zoom: 1.8 },
  "north-america": { longitude: -95.7129, latitude: 37.0902, zoom: 2.8 },
  "south-america": { longitude: -58.3816, latitude: -14.2350, zoom: 2.5 },
  "europe": { longitude: 10.4515, latitude: 51.1657, zoom: 3.2 },
  "africa": { longitude: 20.0, latitude: 0.0, zoom: 2.5 },
  "asia": { longitude: 100.6197, latitude: 34.0479, zoom: 2.5 },
  "oceania": { longitude: 133.7751, latitude: -25.2744, zoom: 3 },
  "middle-east": { longitude: 45.0792, latitude: 29.3117, zoom: 3.5 },
};

export default function CrisisMap({ regions, focusRegion = "all", onMapError }: CrisisMapProps) {
  const { theme, resolvedTheme } = useTheme();
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.2,
  });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? 
    'pk.eyJ1IjoiZ3NnMjEwMDAxIiwiYSI6ImNtZzRpNjZ4ejFsNTgybW9mbnlyNmIxY28ifQ.01BgG4RXjP9pn8PYGc7sDw';

  const isDark = resolvedTheme === 'dark' || theme === 'dark';
  const mapStyle = isDark 
    ? "mapbox://styles/mapbox/dark-v11" 
    : "mapbox://styles/mapbox/light-v11";

  const getMarkerColor = useCallback((severity: string) => {
    switch (severity) {
      case 'Critical':
        return '#d62728';
      case 'High':
        return '#ff7f0e';
      case 'Medium':
        return '#1f77b4';
      default:
        return '#888888';
    }
  }, []);

  const getMarkerSize = useCallback((incidents: number) => {
    return Math.min(Math.max(incidents / 10, 15), 40);
  }, []);

  useEffect(() => {
    if (mapRef.current && focusRegion) {
      const target = REGION_CENTERS[focusRegion];
      if (target) {
        mapRef.current.flyTo({
          center: [target.longitude, target.latitude],
          zoom: target.zoom,
          duration: 2000,
          essential: true
        });
      }
    }
  }, [focusRegion]);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapboxAccessToken={mapboxToken}
      mapStyle={mapStyle}
      style={{ width: "100%", height: "100%" }}
      scrollZoom={true}
      dragPan={true}
      dragRotate={true}
      doubleClickZoom={true}
      touchZoomRotate={true}
      onError={(error) => {
        console.error('Map error:', error);
        if (error?.error && onMapError) {
          onMapError(error.error as Error);
        }
      }}
    >
      <NavigationControl position="top-right" />
      {regions.map((region, index) => (
        <Marker
          key={index}
          longitude={region.coordinates[0]}
          latitude={region.coordinates[1]}
          anchor="center"
        >
          <div
            className="cursor-pointer transition-transform hover:scale-110"
            style={{
              width: getMarkerSize(region.incidents),
              height: getMarkerSize(region.incidents),
              borderRadius: "50%",
              backgroundColor: getMarkerColor(region.severity),
              border: "2px solid white",
              opacity: 0.8,
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRegion(region);
            }}
          />
        </Marker>
      ))}

      {selectedRegion && (
        <Popup
          longitude={selectedRegion.coordinates[0]}
          latitude={selectedRegion.coordinates[1]}
          anchor="bottom"
          onClose={() => setSelectedRegion(null)}
          closeButton={true}
          closeOnClick={false}
          className="crisis-map-popup"
        >
          <div className="bg-card text-card-foreground rounded-lg border p-3 min-w-[200px] font-sans">
            <div className="font-semibold text-sm mb-2">
              {selectedRegion.region}
            </div>
            <div className="text-muted-foreground text-xs mb-1">
              {selectedRegion.incidents} incident{selectedRegion.incidents !== 1 ? 's' : ''}
            </div>
            <div className="text-muted-foreground text-xs">
              Severity: <span 
                className="font-medium"
                style={{ color: getMarkerColor(selectedRegion.severity) }}
              >
                {selectedRegion.severity}
              </span>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  );
}
