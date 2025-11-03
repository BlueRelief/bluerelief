"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import type { LogFilters, LogCategory, LogLevel, LogStatus } from "@/types/logs";

interface LogFiltersProps {
  filters: LogFilters;
  onFilterChange: (filters: LogFilters) => void;
}

const CATEGORIES: LogCategory[] = ['auth', 'api', 'error', 'audit', 'data', 'alert', 'email', 'performance', 'task'];
const LEVELS: LogLevel[] = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
const STATUS_OPTIONS: Array<{ value: LogStatus; label: string }> = [
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
  { value: 'pending', label: 'Pending' },
  { value: 'error', label: 'Error' },
];

const DURATION_THRESHOLDS = [
  { value: 1000, label: '>1s' },
  { value: 3000, label: '>3s' },
  { value: 5000, label: '>5s' },
];

export function LogFiltersPanel({
  filters,
  onFilterChange,
}: LogFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCategoryToggle = (category: LogCategory) => {
    const current = filters.categories || [];
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    onFilterChange({ ...filters, categories: updated.length > 0 ? updated : undefined });
  };

  const handleLevelToggle = (level: LogLevel) => {
    const current = filters.levels || [];
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    onFilterChange({ ...filters, levels: updated.length > 0 ? updated : undefined });
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const activeFilterCount = [
    filters.categories?.length,
    filters.levels?.length,
    filters.user_id,
    filters.action,
    filters.status,
    filters.start_date,
    filters.end_date,
    filters.search,
    filters.ip_address,
    filters.response_status,
    filters.min_duration_ms,
    filters.correlation_id,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Log Category */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Category</Label>
          <div className="space-y-2">
            {CATEGORIES.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories?.includes(category) || false}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <Label
                  htmlFor={`category-${category}`}
                  className="text-sm font-normal cursor-pointer capitalize"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Log Level */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Level</Label>
          <div className="space-y-2">
            {LEVELS.map((level) => {
              const isChecked = filters.levels?.includes(level) || false;
              const colorClass =
                level === 'CRITICAL' || level === 'ERROR'
                  ? 'text-[var(--destructive)]'
                  : level === 'WARNING'
                  ? 'text-[var(--warning-600)] dark:text-[var(--warning-400)]'
                  : level === 'INFO'
                  ? 'text-[var(--info-600)] dark:text-[var(--info-400)]'
                  : 'text-muted-foreground';
              return (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`level-${level}`}
                    checked={isChecked}
                    onCheckedChange={() => handleLevelToggle(level)}
                  />
                  <Label
                    htmlFor={`level-${level}`}
                    className={`text-sm font-normal cursor-pointer ${colorClass}`}
                  >
                    {level}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Search */}
        <div>
          <Label htmlFor="search" className="text-sm font-medium mb-2 block">
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search in messages..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value || undefined })}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="start-date" className="text-sm font-medium mb-2 block">
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => onFilterChange({ ...filters, start_date: e.target.value || undefined })}
            />
          </div>
          <div>
            <Label htmlFor="end-date" className="text-sm font-medium mb-2 block">
              End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => onFilterChange({ ...filters, end_date: e.target.value || undefined })}
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Status</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="status-all"
                name="status"
                checked={!filters.status}
                onChange={() => onFilterChange({ ...filters, status: undefined })}
                className="w-4 h-4"
              />
              <Label htmlFor="status-all" className="text-sm font-normal cursor-pointer">
                All
              </Label>
            </div>
            {STATUS_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`status-${option.value}`}
                  name="status"
                  checked={filters.status === option.value}
                  onChange={() => onFilterChange({ ...filters, status: option.value })}
                  className="w-4 h-4"
                />
                <Label
                  htmlFor={`status-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span className="text-sm font-medium">Advanced Filters</span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {showAdvanced && (
            <div className="mt-3 space-y-3 pt-3 border-t">
              {/* User ID */}
              <div>
                <Label htmlFor="user-id" className="text-sm font-medium mb-2 block">
                  User ID
                </Label>
                <Input
                  id="user-id"
                  placeholder="Filter by user ID"
                  value={filters.user_id || ''}
                  onChange={(e) => onFilterChange({ ...filters, user_id: e.target.value || undefined })}
                />
              </div>

              {/* Action Type */}
              <div>
                <Label htmlFor="action" className="text-sm font-medium mb-2 block">
                  Action Type
                </Label>
                <Input
                  id="action"
                  placeholder="e.g., LOGIN_SUCCESS"
                  value={filters.action || ''}
                  onChange={(e) => onFilterChange({ ...filters, action: e.target.value || undefined })}
                />
              </div>

              {/* IP Address */}
              <div>
                <Label htmlFor="ip-address" className="text-sm font-medium mb-2 block">
                  IP Address
                </Label>
                <Input
                  id="ip-address"
                  placeholder="Filter by IP address"
                  value={filters.ip_address || ''}
                  onChange={(e) => onFilterChange({ ...filters, ip_address: e.target.value || undefined })}
                />
              </div>

              {/* Response Status */}
              <div>
                <Label htmlFor="response-status" className="text-sm font-medium mb-2 block">
                  Response Status Code
                </Label>
                <Input
                  id="response-status"
                  type="number"
                  placeholder="e.g., 200, 404, 500"
                  value={filters.response_status || ''}
                  onChange={(e) => onFilterChange({
                    ...filters,
                    response_status: e.target.value ? parseInt(e.target.value) : undefined,
                  })}
                />
              </div>

              {/* Duration Threshold */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Duration Threshold</Label>
                <div className="space-y-2">
                  {DURATION_THRESHOLDS.map((threshold) => (
                    <div key={threshold.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`duration-${threshold.value}`}
                        name="duration"
                        checked={filters.min_duration_ms === threshold.value}
                        onChange={() => onFilterChange({
                          ...filters,
                          min_duration_ms: threshold.value,
                        })}
                        className="w-4 h-4"
                      />
                      <Label
                        htmlFor={`duration-${threshold.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {threshold.label}
                      </Label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="duration-none"
                      name="duration"
                      checked={!filters.min_duration_ms}
                      onChange={() => onFilterChange({ ...filters, min_duration_ms: undefined })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="duration-none" className="text-sm font-normal cursor-pointer">
                      None
                    </Label>
                  </div>
                </div>
              </div>

              {/* Correlation ID */}
              <div>
                <Label htmlFor="correlation-id" className="text-sm font-medium mb-2 block">
                  Correlation ID
                </Label>
                <Input
                  id="correlation-id"
                  placeholder="Filter by correlation ID"
                  value={filters.correlation_id || ''}
                  onChange={(e) => onFilterChange({ ...filters, correlation_id: e.target.value || undefined })}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

