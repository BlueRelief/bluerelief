"use client";

import React, { useState, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

interface RegionData {
  region: string;
  incidents: number;
  severity: string;
  coordinates: [number, number];
}

interface CrisisMapProps {
  regions: RegionData[];
  onMapError?: (error: Error) => void;
}

export default function CrisisMap({ regions, onMapError }: CrisisMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.2,
  });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? 
    'pk.eyJ1IjoiZ3NnMjEwMDAxIiwiYSI6ImNtZzRpNjZ4ejFsNTgybW9mbnlyNmIxY28ifQ.01BgG4RXjP9pn8PYGc7sDw';

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

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapboxAccessToken={mapboxToken}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
      scrollZoom={true}
      dragPan={true}
      dragRotate={true}
      doubleClickZoom={true}
      touchZoomRotate={true}
      onError={(error: any) => {
        console.error('Map error:', error);
        onMapError?.(error.error);
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
        >
          <div className="p-2">
            <strong className="block mb-1">{selectedRegion.region}</strong>
            <div className="text-sm">{selectedRegion.incidents} incidents</div>
            <div className="text-sm">Severity: {selectedRegion.severity}</div>
          </div>
        </Popup>
      )}
    </Map>
  );
}
