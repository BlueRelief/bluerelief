"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface HeatmapPoint {
  coordinates: [number, number]; // [longitude, latitude]
  weight?: number; // Optional weight/intensity (0-1)
  [key: string]: any; // Additional properties
}

interface HeatmapLayerProps {
  data: HeatmapPoint[];
  mapboxToken: string;
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ data, mapboxToken }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 3
    });

     map.current.on('load', () => {
       if (!map.current) return;

       console.log('Map loaded, creating heatmap with data:', data);

       // Convert data to GeoJSON format
       const geojsonData: GeoJSON.FeatureCollection = {
         type: 'FeatureCollection',
         features: data.map(point => ({
           type: 'Feature',
           properties: {
             weight: point.weight || 1
           },
           geometry: {
             type: 'Point',
             coordinates: point.coordinates
           }
         }))
       };

       console.log('GeoJSON data created:', geojsonData);

      // Add source
      map.current.addSource('heatmap-source', {
        type: 'geojson',
        data: geojsonData
      });

       // Add heatmap layer
       map.current.addLayer({
         id: 'heatmap-layer',
         type: 'heatmap',
         source: 'heatmap-source',
         paint: {
           // Control point intensity based on weight property
           'heatmap-weight': [
             'interpolate',
             ['linear'],
             ['get', 'weight'],
             0, 0,
             1, 1
           ],
           // Increase intensity as zoom level increases
           'heatmap-intensity': [
             'interpolate',
             ['linear'],
             ['zoom'],
             0, 2,
             9, 5
           ],
           // Color gradient from blue (low) to red (high) - more visible
           'heatmap-color': [
             'interpolate',
             ['linear'],
             ['heatmap-density'],
             0, 'rgba(33,102,172,0)',      // Transparent blue
             0.1, 'rgba(33,102,172,0.5)',  // Light blue
             0.2, 'rgba(103,169,207,0.7)', // Light blue
             0.4, 'rgba(209,229,240,0.8)', // Pale blue
             0.6, 'rgba(253,219,199,0.9)', // Pale orange
             0.8, 'rgba(239,138,98,1)',    // Orange
             1, 'rgba(178,24,43,1)'        // Red
           ],
           // Adjust radius by zoom level - make it much larger
           'heatmap-radius': [
             'interpolate',
             ['linear'],
             ['zoom'],
             0, 10,
             9, 50
           ],
           // Keep heatmap visible at all zoom levels
           'heatmap-opacity': 0.8
         }
       });

       console.log('Heatmap layer added');

     
       // map.current.addLayer({
       //   id: 'heatmap-point',
       //   type: 'circle',
       //   source: 'heatmap-source',
       //   minzoom: 7,
       //   paint: {
       //     'circle-radius': [
       //       'interpolate',
       //       ['linear'],
       //       ['zoom'],
       //       7, 1,
       //       16, 5
       //     ],
       //     'circle-color': 'rgb(178,24,43)',
       //     'circle-stroke-color': 'white',
       //     'circle-stroke-width': 1,
       //     'circle-opacity': [
       //       'interpolate',
       //       ['linear'],
       //       ['zoom'],
       //       7, 0,
       //       9, 1
       //     ]
       //   }
       // });
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [data, mapboxToken]);

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height: '600px' }}
    />
  );
};

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
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? 
    'pk.eyJ1IjoiZ3NnMjEwMDAxIiwiYSI6ImNtZzRpNjZ4ejFsNTgybW9mbnlyNmIxY28ifQ.01BgG4RXjP9pn8PYGc7sDw';

  // Convert regions to heatmap data, or use mock data if regions is empty
  const heatmapData: HeatmapPoint[] = regions.length > 0 ? regions.map(region => {
    const severity_weights = {
      'Critical': 1.0,
      'High': 0.8,
      'Medium': 0.6,
      'Low': 0.4
    };
    
    const weight = severity_weights[region.severity as keyof typeof severity_weights] || 0.5;
    
    return {
      coordinates: region.coordinates,
      weight: weight
    };
  }) : [
    // Mock data for testing
    { coordinates: [-74.006, 40.7128], weight: 0.9 }, // NYC
    { coordinates: [-118.2437, 34.0522], weight: 0.8 }, // LA
    { coordinates: [-87.6298, 41.8781], weight: 0.7 }, // Chicago
    { coordinates: [-95.3698, 29.7604], weight: 0.6 }, // Houston
    { coordinates: [-75.1652, 39.9526], weight: 0.5 }, // Philadelphia
    { coordinates: [-122.4194, 37.7749], weight: 0.8 }, // San Francisco
    { coordinates: [-80.1918, 25.7617], weight: 0.7 }, // Miami
    { coordinates: [-97.5164, 35.4676], weight: 0.6 }, // Oklahoma City
  ];

  console.log('Heatmap data prepared:', heatmapData);

  return (
    <HeatmapLayer 
      data={heatmapData}
      mapboxToken={mapboxToken}
    />
  );
}