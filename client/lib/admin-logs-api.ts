import { adminApiGet, adminApiPost } from './admin-api-client';
import type { SystemLog, LogFilters, LogStats, LogsResponse } from '@/types/logs';

/**
 * Build query string from filters object
 */
function buildQueryString(filters: LogFilters, page: number = 1, limit: number = 50, sort?: string, order: 'asc' | 'desc' = 'desc'): string {
  const params = new URLSearchParams();
  
  if (filters.categories && filters.categories.length > 0) {
    params.append('category', filters.categories.join(','));
  }
  if (filters.levels && filters.levels.length > 0) {
    params.append('level', filters.levels.join(','));
  }
  if (filters.user_id) {
    params.append('user_id', filters.user_id);
  }
  if (filters.action) {
    params.append('action', filters.action);
  }
  if (filters.status) {
    params.append('status', filters.status);
  }
  if (filters.start_date) {
    params.append('start_date', filters.start_date);
  }
  if (filters.end_date) {
    params.append('end_date', filters.end_date);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.ip_address) {
    params.append('ip_address', filters.ip_address);
  }
  if (filters.response_status) {
    params.append('response_status', filters.response_status.toString());
  }
  if (filters.min_duration_ms) {
    params.append('min_duration_ms', filters.min_duration_ms.toString());
  }
  if (filters.correlation_id) {
    params.append('correlation_id', filters.correlation_id);
  }
  
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (sort) {
    params.append('sort', sort);
    params.append('order', order);
  }
  
  return params.toString();
}

/**
 * Fetch paginated logs with filters
 */
export async function fetchLogs(
  filters: LogFilters = {},
  page: number = 1,
  limit: number = 50,
  sort?: string,
  order: 'asc' | 'desc' = 'desc'
): Promise<LogsResponse> {
  const queryString = buildQueryString(filters, page, limit, sort, order);
  const response = await adminApiGet<LogsResponse>(`/api/admin/logs?${queryString}`);
  return response;
}

/**
 * Fetch single log detail by ID
 */
export async function fetchLogDetail(logId: string): Promise<SystemLog> {
  const response = await adminApiGet<SystemLog>(`/api/admin/logs/${logId}`);
  return response;
}

/**
 * Fetch log statistics
 */
export async function fetchLogStats(): Promise<LogStats> {
  const response = await adminApiGet<LogStats>('/api/admin/logs/stats');
  return response;
}

/**
 * Export logs as CSV or JSON
 */
export async function exportLogs(
  filters: LogFilters = {},
  format: 'csv' | 'json' = 'json'
): Promise<Blob> {
  const queryString = buildQueryString(filters, 1, 10000); // Large limit for export
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/logs/export?${queryString}&format=${format}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || ''}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }
  
  return response.blob();
}

/**
 * Fetch logs with same correlation ID
 */
export async function fetchCorrelatedLogs(correlationId: string): Promise<SystemLog[]> {
  const response = await adminApiGet<{ logs: SystemLog[] }>(`/api/admin/logs?correlation_id=${correlationId}&limit=100`);
  return response.logs;
}

