"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Copy, CheckCircle2, ExternalLink, Download } from "lucide-react";
import type { SystemLog } from "@/types/logs";
import { formatActivityTime } from "@/lib/utils";

interface LogDetailPanelProps {
  log: SystemLog | null;
  open: boolean;
  onClose: () => void;
  onViewUser?: (userId: string) => void;
  onViewRelated?: (correlationId: string) => void;
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

function getLevelColor(level: string): string {
  switch (level) {
    case 'CRITICAL':
    case 'ERROR':
      return 'bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]';
    case 'WARNING':
      return 'bg-[var(--warning-500)]/10 text-[var(--warning-600)] dark:text-[var(--warning-400)] border-[var(--warning-600)] dark:border-[var(--warning-400)]';
    case 'INFO':
      return 'bg-[var(--info-500)]/10 text-[var(--info-600)] dark:text-[var(--info-400)] border-[var(--info-600)] dark:border-[var(--info-400)]';
    case 'DEBUG':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    auth: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-700 dark:border-purple-300',
    api: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-700 dark:border-blue-300',
    error: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-700 dark:border-red-300',
    audit: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-700 dark:border-green-300',
    data: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-700 dark:border-cyan-300',
    alert: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-700 dark:border-orange-300',
    email: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-700 dark:border-pink-300',
    performance: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-700 dark:border-yellow-300',
    task: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-700 dark:border-indigo-300',
  };
  return colors[category] || 'bg-muted text-muted-foreground border-border';
}

function getInitials(email?: string, name?: string): string {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '?';
}

function formatJSON(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export function LogDetailPanel({
  log,
  open,
  onClose,
  onViewUser,
  onViewRelated,
}: LogDetailPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!log) return null;

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(key === 'json' ? null : key), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = formatJSON(log);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log-${log.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Log Details</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Category</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={`capitalize ${getCategoryColor(log.log_category)}`}>
                      {log.log_category}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Level</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={getLevelColor(log.log_level)}>
                      {log.log_level}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Timestamp</label>
                  <div className="mt-1 text-sm font-medium">
                    {formatActivityTime(log.created_at)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimestamp(log.created_at)}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="capitalize">
                      {log.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-xs text-muted-foreground">Action</label>
                <div className="mt-1 text-sm font-mono">{log.action}</div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Message</label>
                <div className="mt-1 text-sm">{log.message}</div>
              </div>

              {log.user_id && (
                <div>
                  <label className="text-xs text-muted-foreground">User</label>
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(log.user_email, log.user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {log.user_name || log.user_email || 'Unknown'}
                      </div>
                      {log.user_email && log.user_name && (
                        <div className="text-xs text-muted-foreground">{log.user_email}</div>
                      )}
                      {onViewUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 px-2 text-xs"
                          onClick={() => onViewUser(log.user_id!)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View User
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Details */}
          {(log.request_method || log.request_path) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {log.request_method && (
                  <div>
                    <label className="text-xs text-muted-foreground">Method</label>
                    <div className="mt-1 text-sm font-mono">{log.request_method}</div>
                  </div>
                )}
                {log.request_path && (
                  <div>
                    <label className="text-xs text-muted-foreground">Path</label>
                    <div className="mt-1 text-sm font-mono break-all">{log.request_path}</div>
                  </div>
                )}
                {log.response_status && (
                  <div>
                    <label className="text-xs text-muted-foreground">Response Status</label>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={
                          log.response_status >= 500
                            ? 'text-[var(--destructive)]'
                            : log.response_status >= 400
                            ? 'text-[var(--warning-600)]'
                            : 'text-[var(--success-600)]'
                        }
                      >
                        {log.response_status}
                      </Badge>
                    </div>
                  </div>
                )}
                {log.duration_ms !== undefined && (
                  <div>
                    <label className="text-xs text-muted-foreground">Duration</label>
                    <div className={`mt-1 text-sm ${log.duration_ms > 1000 ? 'text-[var(--destructive)] font-medium' : ''}`}>
                      {log.duration_ms}ms
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Details */}
          {(log.error_type || log.error_message || log.stack_trace) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Error Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {log.error_type && (
                  <div>
                    <label className="text-xs text-muted-foreground">Error Type</label>
                    <div className="mt-1 text-sm font-mono">{log.error_type}</div>
                  </div>
                )}
                {log.error_message && (
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center justify-between">
                      Error Message
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleCopy(log.error_message!, 'error')}
                      >
                        {copied === 'error' ? (
                          <CheckCircle2 className="h-3 w-3 text-[var(--success-600)]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </label>
                    <div className="mt-1 text-sm font-mono bg-muted p-2 rounded break-all">
                      {log.error_message}
                    </div>
                  </div>
                )}
                {log.stack_trace && (
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center justify-between">
                      Stack Trace
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleCopy(log.stack_trace!, 'stack')}
                      >
                        {copied === 'stack' ? (
                          <CheckCircle2 className="h-3 w-3 text-[var(--success-600)]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </label>
                    <pre className="mt-1 text-xs font-mono bg-muted p-3 rounded overflow-x-auto">
                      {log.stack_trace}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Context/Metadata */}
          {log.details && Object.keys(log.details).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Context / Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">Details</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleCopy(formatJSON(log.details), 'json')}
                  >
                    {copied === 'json' ? (
                      <CheckCircle2 className="h-3 w-3 text-[var(--success-600)] mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    Copy JSON
                  </Button>
                </div>
                <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto max-h-[300px] overflow-y-auto">
                  {formatJSON(log.details)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {log.ip_address && (
                <div>
                  <label className="text-xs text-muted-foreground">IP Address</label>
                  <div className="mt-1 text-sm font-mono">{log.ip_address}</div>
                </div>
              )}
              {log.user_agent && (
                <div>
                  <label className="text-xs text-muted-foreground">User Agent</label>
                  <div className="mt-1 text-sm break-all">{log.user_agent}</div>
                </div>
              )}
              {log.correlation_id && (
                <div>
                  <label className="text-xs text-muted-foreground flex items-center justify-between">
                    Correlation ID
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleCopy(log.correlation_id!, 'correlation')}
                    >
                      {copied === 'correlation' ? (
                        <CheckCircle2 className="h-3 w-3 text-[var(--success-600)]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </label>
                  <div className="mt-1 text-sm font-mono break-all">{log.correlation_id}</div>
                  {onViewRelated && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => onViewRelated(log.correlation_id!)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Related Logs
                    </Button>
                  )}
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground">Log ID</label>
                <div className="mt-1 text-sm font-mono break-all">{log.id}</div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleExportJSON}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

