"use client"

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import type { SystemLog } from "@/types/logs";
import { formatActivityTime } from "@/lib/utils";

interface LogTableProps {
  logs: SystemLog[];
  loading?: boolean;
  onLogClick?: (log: SystemLog) => void;
  selectedLogId?: string;
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

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-[var(--success-600)] dark:text-[var(--success-400)]" />;
    case 'failure':
    case 'error':
      return <XCircle className="h-4 w-4 text-[var(--destructive)]" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-[var(--warning-600)] dark:text-[var(--warning-400)]" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  }
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

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

export function LogTable({ logs, loading, onLogClick, selectedLogId }: LogTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(10)].map((_, idx) => (
              <TableRow key={idx}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No logs found matching your filters.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const isSelected = selectedLogId === log.id;
              const truncatedMessage = log.message.length > 60
                ? `${log.message.substring(0, 60)}...`
                : log.message;

              return (
                <TableRow
                  key={log.id}
                  className={`cursor-pointer hover:bg-accent/50 ${isSelected ? 'bg-accent' : ''}`}
                  onClick={() => onLogClick?.(log)}
                >
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm">{formatActivityTime(log.created_at)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{formatTimestamp(log.created_at)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs capitalize ${getCategoryColor(log.log_category)}`}>
                      {log.log_category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${getLevelColor(log.log_level)}`}>
                      {log.log_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.user_email || log.user_name ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(log.user_email, log.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[120px]">
                            {log.user_name || log.user_email}
                          </span>
                          {log.user_name && log.user_email && (
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {log.user_email}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{log.action}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(log.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm truncate block max-w-[300px]">{truncatedMessage}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs break-words">{log.message}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {log.duration_ms !== undefined ? (
                      <span className={`text-sm ${log.duration_ms > 1000 ? 'text-[var(--destructive)] font-medium' : ''}`}>
                        {log.duration_ms}ms
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.correlation_id && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(log.correlation_id!, log.id);
                            }}
                          >
                            {copiedId === log.id ? (
                              <CheckCircle2 className="h-3 w-3 text-[var(--success-600)]" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy Correlation ID</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

