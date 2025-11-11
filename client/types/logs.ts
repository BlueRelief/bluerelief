export type LogCategory = 'auth' | 'api' | 'error' | 'audit' | 'data' | 'alert' | 'email' | 'performance' | 'task';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type LogStatus = 'success' | 'failure' | 'pending' | 'error';

export interface SystemLog {
  id: string;
  log_category: LogCategory;
  log_level: LogLevel;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: string;
  status: LogStatus;
  message: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  request_method?: string;
  request_path?: string;
  response_status?: number;
  duration_ms?: number;
  error_type?: string;
  error_message?: string;
  stack_trace?: string;
  correlation_id?: string;
  created_at: string;
}

export interface LogFilters {
  categories?: LogCategory[];
  levels?: LogLevel[];
  user_id?: string;
  action?: string;
  status?: LogStatus;
  start_date?: string;
  end_date?: string;
  search?: string;
  ip_address?: string;
  response_status?: number;
  min_duration_ms?: number;
  correlation_id?: string;
}

export interface LogStats {
  total_today: number;
  error_rate: number;
  avg_response_time: number;
  failed_logins: number;
  slow_queries: number;
  active_users: number;
}

export interface LogsResponse {
  logs: SystemLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

