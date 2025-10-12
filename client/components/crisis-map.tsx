"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface HeatmapPoint {
  coordinates: [number, number];
  weight?: number;
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

    mapboxgl.accessToken = mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.5795, 39.8283],
      zoom: 3
    });

     map.current.on('load', () => {
       if (!map.current) return;

       console.log('Map loaded, creating heatmap with data:', data);

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

      map.current.addSource('heatmap-source', {
        type: 'geojson',
        data: geojsonData
      });

       map.current.addLayer({
         id: 'heatmap-layer',
         type: 'heatmap',
         source: 'heatmap-source',
         paint: {
           'heatmap-weight': [
             'interpolate',
             ['linear'],
             ['get', 'weight'],
             0, 0,
             1, 1
           ],
           'heatmap-intensity': [
             'interpolate',
             ['linear'],
             ['zoom'],
             0, 2,
             9, 5
           ],
           'heatmap-color': [
             'interpolate',
             ['linear'],
             ['heatmap-density'],
             0, 'rgba(33,102,172,0)',
             0.1, 'rgba(33,102,172,0.5)',
             0.2, 'rgba(103,169,207,0.7)',
             0.4, 'rgba(209,229,240,0.8)',
             0.6, 'rgba(253,219,199,0.9)',
             0.8, 'rgba(239,138,98,1)',
             1, 'rgba(178,24,43,1)'
           ],
           'heatmap-radius': [
             'interpolate',
             ['linear'],
             ['zoom'],
             0, 10,
             9, 50
           ],
           'heatmap-opacity': 0.8
         }
       });

       console.log('Heatmap layer added');
    });

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
}

export default function CrisisMap({ regions }: CrisisMapProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? 
    'pk.eyJ1IjoiZ3NnMjEwMDAxIiwiYSI6ImNtZzRpNjZ4ejFsNTgybW9mbnlyNmIxY28ifQ.01BgG4RXjP9pn8PYGc7sDw';

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
    { coordinates: [-74.006, 40.7128], weight: 0.9 },
    { coordinates: [-118.2437, 34.0522], weight: 0.8 },
    { coordinates: [-87.6298, 41.8781], weight: 0.7 },
    { coordinates: [-95.3698, 29.7604], weight: 0.6 },
    { coordinates: [-75.1652, 39.9526], weight: 0.5 },
    { coordinates: [-122.4194, 37.7749], weight: 0.8 },
    { coordinates: [-80.1918, 25.7617], weight: 0.7 },
    { coordinates: [-97.5164, 35.4676], weight: 0.6 },
  ];

  console.log('Heatmap data prepared:', heatmapData);

  return (
    <HeatmapLayer 
      data={heatmapData}
      mapboxToken={mapboxToken}
    />
  );
}