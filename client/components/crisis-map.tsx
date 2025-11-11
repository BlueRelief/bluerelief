"use client";

import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SentimentBadge } from "@/components/sentiment-badge";
import { ExternalLink, Calendar, MapPin, AlertTriangle, Users, Activity } from "lucide-react";
import { apiGet } from "@/lib/api-client";

interface HeatmapPoint {
  coordinates: [number, number];
  weight?: number;
}

interface RegionData {
  id?: number;
  region: string;
  incidents: number;
  severity: string;
  coordinates: [number, number];
  crisis_description?: string;
}

interface DisasterDetails {
  id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  disaster_type: string;
  severity: number;
  magnitude?: number;
  description: string;
  affected_population?: number;
  event_time?: string;
  extracted_at: string;
  bluesky_url?: string;
  sentiment?: string | null;
  sentiment_score?: number | null;
  post?: {
    text?: string;
    author_handle?: string;
    sentiment?: string;
    sentiment_score?: number;
  };
}

interface HeatmapLayerProps {
  data: HeatmapPoint[];
  regions: RegionData[];
  mapboxToken: string;
  focusRegion?: string;
  onViewDetails: (regionId: number) => void;
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = memo(({ data, regions, mapboxToken, focusRegion, onViewDetails }) => {
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

         // Create popup content with button
         const popupContent = document.createElement('div');
         popupContent.className = 'bg-card p-4 rounded-lg border border-border min-w-[250px] max-w-[350px]';
         popupContent.innerHTML = `
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
         `;

         // Add button if region has an ID
         if (region.id) {
           const buttonContainer = document.createElement('div');
           buttonContainer.className = 'mt-3';
           const button = document.createElement('button');
           button.className = 'w-full px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors border border-primary/20';
           button.textContent = 'View Full Details';
           button.onclick = (e) => {
             e.stopPropagation();
             onViewDetails(region.id!);
           };
           buttonContainer.appendChild(button);
           popupContent.appendChild(buttonContainer);
         }

         const popup = new mapboxgl.Popup({
           offset: 25,
           closeButton: true,
           className: 'map-popup'
         }).setDOMContent(popupContent);

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
  }, [data, regions, mapboxToken, resolvedTheme, onViewDetails]);

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
});

HeatmapLayer.displayName = 'HeatmapLayer';

interface CrisisMapProps {
  regions: RegionData[];
  focusRegion?: string;
}

export default function CrisisMap({ regions, focusRegion }: CrisisMapProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [selectedEvent, setSelectedEvent] = useState<DisasterDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleViewDetails = useCallback(async (regionId: number) => {
    try {
      setIsLoading(true);
      const data = await apiGet<DisasterDetails>(`/api/incidents/${regionId}`);
      setSelectedEvent(data);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch disaster details:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSeverityBadgeVariant = (severity?: number) => {
    if (!severity) return "secondary";
    if (severity >= 4) return "destructive";
    return "secondary";
  };

  const getSeverityLabel = (severity?: number) => {
    const labels: { [key: number]: string } = {
      5: "Critical",
      4: "High",
      3: "Medium",
      2: "Low",
      1: "Info"
    };
    return severity ? labels[severity] || "Unknown" : "Unknown";
  };

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
    <>
      <HeatmapLayer
        data={heatmapData}
        regions={validRegions}
        mapboxToken={mapboxToken}
        focusRegion={focusRegion}
        onViewDetails={handleViewDetails}
      />

      {/* Event Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : selectedEvent ? (
            <>
              <DialogHeader>
                <div className="pr-8">
                  <div className="flex items-center justify-between gap-4">
                    <DialogTitle className="text-xl">Crisis Event Details</DialogTitle>
                    <div className="flex gap-2">
                      <Badge
                        variant={getSeverityBadgeVariant(selectedEvent.severity)}
                        className="text-sm"
                      >
                        {getSeverityLabel(selectedEvent.severity)}
                      </Badge>
                      {selectedEvent.sentiment && (
                        <SentimentBadge
                          sentiment={selectedEvent.sentiment}
                          sentiment_score={selectedEvent.sentiment_score}
                          size="md"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {selectedEvent.location_name}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Disaster Type */}
                {selectedEvent.disaster_type && (
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Disaster Type</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {selectedEvent.disaster_type}
                      </p>
                    </div>
                  </div>
                )}

                {/* Time Information */}
                {selectedEvent.event_time && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Event Time</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedEvent.event_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Affected Population */}
                {selectedEvent.affected_population && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Affected Population</p>
                      <p className="text-sm text-muted-foreground">
                        Approximately {selectedEvent.affected_population.toLocaleString()} people
                      </p>
                    </div>
                  </div>
                )}

                {/* Full Description */}
                <div>
                  <p className="text-sm font-semibold mb-2">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedEvent.description || 'No detailed description available.'}
                  </p>
                </div>

                {/* Magnitude (if applicable) */}
                {selectedEvent.magnitude && (
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Magnitude</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.magnitude}
                      </p>
                    </div>
                  </div>
                )}

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Latitude</p>
                    <p className="text-sm">{selectedEvent.latitude?.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Longitude</p>
                    <p className="text-sm">{selectedEvent.longitude?.toFixed(4)}</p>
                  </div>
                </div>

                {/* Source Post Link */}
                {selectedEvent.bluesky_url && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(selectedEvent.bluesky_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original Bluesky Post
                    </Button>
                  </div>
                )}

                {/* Additional Metadata */}
                <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
                  <p>Event ID: {selectedEvent.id}</p>
                  <p>Reported: {new Date(selectedEvent.extracted_at).toLocaleString()}</p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No data available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
