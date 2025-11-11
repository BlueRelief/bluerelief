import { useState, useCallback, useEffect } from 'react';
import type { LogFilters } from '@/types/logs';

const FILTER_PRESET_KEY = 'admin_log_filters_preset';

export function useLogFilters(initialFilters: LogFilters = {}) {
  const [filters, setFilters] = useState<LogFilters>(initialFilters);
  const [savedPresets, setSavedPresets] = useState<Record<string, LogFilters>>({});

  // Load saved presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILTER_PRESET_KEY);
      if (saved) {
        setSavedPresets(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error);
    }
  }, []);

  const updateFilter = useCallback((key: keyof LogFilters, value: string | string[] | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === undefined || value === '' || (Array.isArray(value) && value.length === 0) 
        ? undefined 
        : value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const savePreset = useCallback((name: string, presetFilters: LogFilters) => {
    const newPresets = {
      ...savedPresets,
      [name]: presetFilters,
    };
    setSavedPresets(newPresets);
    try {
      localStorage.setItem(FILTER_PRESET_KEY, JSON.stringify(newPresets));
    } catch (error) {
      console.error('Failed to save filter preset:', error);
    }
  }, [savedPresets]);

  const loadPreset = useCallback((name: string) => {
    if (savedPresets[name]) {
      setFilters(savedPresets[name]);
    }
  }, [savedPresets]);

  const deletePreset = useCallback((name: string) => {
    const newPresets = { ...savedPresets };
    delete newPresets[name];
    setSavedPresets(newPresets);
    try {
      localStorage.setItem(FILTER_PRESET_KEY, JSON.stringify(newPresets));
    } catch (error) {
      console.error('Failed to delete filter preset:', error);
    }
  }, [savedPresets]);

  return {
    filters,
    updateFilter,
    clearFilters,
    savedPresets,
    savePreset,
    loadPreset,
    deletePreset,
  };
}

