"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from 'next-themes';

interface HeatmapPoint {
  coordinates: [number, number];
  weight?: number;
}

interface RegionData {
  region: string;
  incidents: number;
  severity: string;
  coordinates: [number, number];
  crisis_description?: string;
}

interface HeatmapLayerProps {
  data: HeatmapPoint[];
  regions: RegionData[];
  mapboxToken: string;
  focusRegion?: string;
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ data, regions, mapboxToken, focusRegion }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { resolvedTheme } = useTheme();
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const isMapLoaded = useRef<boolean>(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    const mapStyle = resolvedTheme === 'dark' 
      ? 'mapbox://styles/mapbox/dark-v11' 
      : 'mapbox://styles/mapbox/light-v11';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [-98.5795, 39.8283],
      zoom: 3
    });

     map.current.on('load', () => {
       if (!map.current) return;

       isMapLoaded.current = true;

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
             0, 1,
             3, 2,
             6, 3,
             9, 4
           ],
           'heatmap-color': [
             'interpolate',
             ['linear'],
             ['heatmap-density'],
             0, 'rgba(0, 0, 0, 0)',
             0.2, 'rgba(34, 197, 94, 0.6)',
             0.4, 'rgba(234, 179, 8, 0.7)',
             0.6, 'rgba(249, 115, 22, 0.8)',
             0.8, 'rgba(239, 68, 68, 0.9)',
             1, 'rgba(220, 38, 38, 1)'
           ],
           'heatmap-radius': [
             'interpolate',
             ['linear'],
             ['zoom'],
             0, 40,
             3, 60,
             6, 80,
             9, 100
           ],
           'heatmap-opacity': [
             'interpolate',
             ['linear'],
             ['zoom'],
             0, 0.9,
             9, 0.8
           ]
         }
       });

       
       markersRef.current.forEach(marker => marker.remove());
       markersRef.current = [];
       
       regions.forEach(region => {
         if (!map.current) return;
         
         // skip regions with invalid coordinates
         if (!region.coordinates || !Array.isArray(region.coordinates) || region.coordinates.length !== 2) {
           console.warn('Skipping region with invalid coordinates:', region);
           return;
         }
         
         const [lng, lat] = region.coordinates;
         if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
           console.warn('Skipping region with invalid coordinate values:', region);
           return;
         }
         
         const severityColors = {
           'Critical': '#dc2626',
           'High': '#ea580c',
           'Medium': '#f59e0b',
           'Low': '#10b981'
         };
         
         const color = severityColors[region.severity as keyof typeof severityColors] || '#6b7280';
         
         const el = document.createElement('div');
         el.className = 'marker';
         el.style.backgroundColor = color;
         el.style.width = '12px';
         el.style.height = '12px';
         el.style.borderRadius = '50%';
         el.style.border = '1px solid rgba(255,255,255,0.5)';
         el.style.cursor = 'pointer';
         el.style.boxShadow = `0 0 8px ${color}`;
         el.style.opacity = '0.8';
         
         const popupContent = `
           <div class="bg-card p-4 rounded-lg border border-border min-w-[250px] max-w-[350px]">
             <h3 class="font-semibold text-card-foreground mb-2">${region.region}</h3>
             <div class="space-y-1 text-sm">
               <p class="text-muted-foreground">
                 <span class="font-medium">Incidents:</span> ${region.incidents}
               </p>
               <p class="text-muted-foreground">
                 <span class="font-medium">Severity:</span> 
                 <span class="font-semibold" style="color: ${color}">${region.severity}</span>
               </p>
               <p class="text-muted-foreground">
                 <span class="font-medium">Description:</span><br>
                 <span style="font-style: italic; word-wrap: break-word; line-height: 1.3;">${region.crisis_description || 'No description available'}</span>
               </p>
             </div>
           </div>
         `;
         
         const popup = new mapboxgl.Popup({ 
           offset: 25,
           closeButton: true,
           className: 'map-popup'
         }).setHTML(popupContent);
         
         const marker = new mapboxgl.Marker({ element: el })
           .setLngLat([lng, lat])
           .setPopup(popup)
           .addTo(map.current);
         
         markersRef.current.push(marker);
       });
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      isMapLoaded.current = false;
      map.current?.remove();
    };
  }, [data, regions, mapboxToken, resolvedTheme]);

  useEffect(() => {
    if (!map.current || !resolvedTheme || !isMapLoaded.current) return;
    
    const mapStyle = resolvedTheme === 'dark' 
      ? 'mapbox://styles/mapbox/dark-v11' 
      : 'mapbox://styles/mapbox/light-v11';
    
    map.current.setStyle(mapStyle);
    
    map.current.once('style.load', () => {
      if (!map.current) return;
      
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

      if (!map.current.getSource('heatmap-source')) {
        map.current.addSource('heatmap-source', {
          type: 'geojson',
          data: geojsonData
        });
      }

      if (!map.current.getLayer('heatmap-layer')) {
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
              0, 1,
              3, 2,
              6, 3,
              9, 4
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 0, 0)',
              0.2, 'rgba(34, 197, 94, 0.6)',
              0.4, 'rgba(234, 179, 8, 0.7)',
              0.6, 'rgba(249, 115, 22, 0.8)',
              0.8, 'rgba(239, 68, 68, 0.9)',
              1, 'rgba(220, 38, 38, 1)'
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 40,
              3, 60,
              6, 80,
              9, 100
            ],
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 0.9,
              9, 0.8
            ]
          }
        });
      }
    });
  }, [resolvedTheme, data]);

  useEffect(() => {
    if (!map.current || !focusRegion || focusRegion === 'all') return;
    
    const regionCenters: { [key: string]: { center: [number, number], zoom: number } } = {
      'north-america': { center: [-100, 45], zoom: 3 },
      'south-america': { center: [-60, -15], zoom: 3 },
      'europe': { center: [15, 50], zoom: 4 },
      'africa': { center: [20, 0], zoom: 3 },
      'middle-east': { center: [48, 28], zoom: 4 },
      'asia': { center: [90, 30], zoom: 3 },
      'oceania': { center: [140, -25], zoom: 3 },
    };
    
    const target = regionCenters[focusRegion];
    if (target) {
      map.current.flyTo({
        center: target.center,
        zoom: target.zoom,
        duration: 1500
      });
    } else {
      map.current.flyTo({
        center: [-98.5795, 39.8283],
        zoom: 3,
        duration: 1500
      });
    }
  }, [focusRegion]);

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height: '600px' }}
    />
  );
};

interface CrisisMapProps {
  regions: RegionData[];
  focusRegion?: string;
}

export default function CrisisMap({ regions, focusRegion }: CrisisMapProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-muted/50 rounded-lg border border-dashed">
        <div className="text-center">
          <div className="text-lg font-medium text-destructive mb-2">Mapbox Token Missing</div>
          <div className="text-sm text-muted-foreground">
            Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables
          </div>
        </div>
      </div>
    );
  }

  const validRegions = regions.filter(region => {
    if (!region.coordinates || !Array.isArray(region.coordinates) || region.coordinates.length !== 2) {
      return false;
    }
    const [lng, lat] = region.coordinates;
    return typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat);
  });

  const heatmapData: HeatmapPoint[] = validRegions.map(region => {
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
  });


  return (
    <HeatmapLayer 
      data={heatmapData}
      regions={validRegions}
      mapboxToken={mapboxToken}
      focusRegion={focusRegion}
    />
  );
}
