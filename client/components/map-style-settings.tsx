"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { apiGet, apiPut, apiDelete } from "@/lib/api-client";
import { toast } from "sonner";

interface MapStyle {
  [key: string]: string;
}

interface MapPreferences {
  light_style: string;
  dark_style: string;
}

export function MapStyleSettings() {
  const [lightStyle, setLightStyle] = useState<string>("standard");
  const [darkStyle, setDarkStyle] = useState<string>("standard-satellite");
  const [availableStyles, setAvailableStyles] = useState<MapStyle>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialPreferences, setInitialPreferences] = useState<MapPreferences | null>(null);

  useEffect(() => {
    loadPreferences();
    loadAvailableStyles();
  }, []);

  const loadAvailableStyles = async () => {
    try {
      const data = await apiGet<{ styles: MapStyle }>('/api/map-preferences/styles');
      setAvailableStyles(data.styles);
    } catch (error) {
      console.error('Failed to load available styles:', error);
      toast.error('Failed to load map style options');
    }
  };

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<MapPreferences>('/api/map-preferences');
      setLightStyle(data.light_style);
      setDarkStyle(data.dark_style);
      setInitialPreferences(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load your preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiPut('/api/map-preferences', {
        light_style: lightStyle,
        dark_style: darkStyle,
      });
      setInitialPreferences({ light_style: lightStyle, dark_style: darkStyle });
      setHasChanges(false);
      toast.success('Map style preferences saved!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      await apiDelete('/api/map-preferences');
      setLightStyle('standard');
      setDarkStyle('standard-satellite');
      setInitialPreferences({ light_style: 'standard', dark_style: 'standard-satellite' });
      setHasChanges(false);
      toast.success('Preferences reset to defaults');
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      toast.error('Failed to reset preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLightStyleChange = (value: string) => {
    setLightStyle(value);
    setHasChanges(true);
  };

  const handleDarkStyleChange = (value: string) => {
    setDarkStyle(value);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Map Style Preferences</CardTitle>
          <CardDescription>Customize your map appearance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Style Preferences</CardTitle>
        <CardDescription>
          Choose different map styles for light and dark themes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Light Theme Map Style</label>
          <Select value={lightStyle} onValueChange={handleLightStyleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select light theme style" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(availableStyles).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This style will be used when your theme is set to light mode
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Dark Theme Map Style</label>
          <Select value={darkStyle} onValueChange={handleDarkStyleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select dark theme style" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(availableStyles).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This style will be used when your theme is set to dark mode
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Recommended:</strong> Standard for light theme, Standard Satellite for dark theme
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


