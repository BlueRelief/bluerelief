"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, AlertTriangle, Clock, Database, Zap } from "lucide-react";
import type { LogStats } from "@/types/logs";

interface LogStatsProps {
  stats: LogStats | null;
  loading?: boolean;
  onCardClick?: (filterKey: string) => void;
}

export function LogStatsCards({ stats, loading, onCardClick }: LogStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      title: 'Total Logs Today',
      value: stats.total_today,
      icon: Database,
      color: 'primary',
      onClick: () => onCardClick?.('today'),
    },
    {
      title: 'Error Rate',
      value: `${(stats.error_rate * 100).toFixed(1)}%`,
      icon: AlertTriangle,
      color: 'destructive',
      onClick: () => onCardClick?.('error'),
    },
    {
      title: 'Avg Response Time',
      value: `${stats.avg_response_time}ms`,
      icon: Clock,
      color: 'warning',
      onClick: () => onCardClick?.('performance'),
    },
    {
      title: 'Failed Logins',
      value: stats.failed_logins,
      icon: AlertTriangle,
      color: 'destructive',
      onClick: () => onCardClick?.('auth'),
    },
    {
      title: 'Slow Queries',
      value: stats.slow_queries,
      icon: Zap,
      color: 'warning',
      onClick: () => onCardClick?.('performance'),
    },
    {
      title: 'Active Users',
      value: stats.active_users,
      icon: TrendingUp,
      color: 'success',
      onClick: () => onCardClick?.('active'),
    },
  ];

  const handleKeyDown = (event: React.KeyboardEvent, onClick: (() => void) | undefined) => {
    if (!onClick) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const borderColor = 
          card.color === 'destructive' ? 'border-l-[var(--destructive)]' :
          card.color === 'warning' ? 'border-l-[var(--warning-500)]' :
          card.color === 'success' ? 'border-l-[var(--success-600)]' :
          'border-l-primary';

        const isClickable = !!onCardClick && !!card.onClick;

        return (
          <Card 
            key={card.title} 
            className={`border-l-4 ${borderColor} ${isClickable ? 'cursor-pointer hover:bg-accent/50 focus:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors' : ''}`}
            onClick={card.onClick}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => handleKeyDown(e, card.onClick)}
            aria-label={isClickable ? `Filter logs by ${card.title.toLowerCase()}` : undefined}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-2xl font-bold" aria-label={`${card.title}: ${card.value}`}>
                    {card.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{card.title}</div>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  card.color === 'destructive' ? 'bg-[var(--destructive)]/10' :
                  card.color === 'warning' ? 'bg-[var(--warning-500)]/10' :
                  card.color === 'success' ? 'bg-[var(--success-600)]/10' :
                  'bg-primary/10'
                }`} aria-hidden="true">
                  <Icon className={`h-5 w-5 ${
                    card.color === 'destructive' ? 'text-[var(--destructive)]' :
                    card.color === 'warning' ? 'text-[var(--warning-500)]' :
                    card.color === 'success' ? 'text-[var(--success-600)]' :
                    'text-primary'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

