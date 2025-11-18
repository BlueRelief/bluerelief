const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let authCallbacks: Array<() => void> = [];

export function onAuthError(callback: () => void) {
  authCallbacks.push(callback);
  return () => {
    authCallbacks = authCallbacks.filter(cb => cb !== callback);
  };
}

function notifyAuthError() {
  authCallbacks.forEach(cb => cb());
}

export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      notifyAuthError();
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await apiClient(endpoint, { method: "GET" });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiPost<T>(endpoint: string, data?: unknown): Promise<T> {
  const response = await apiClient(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiPut<T>(endpoint: string, data?: unknown): Promise<T> {
  const response = await apiClient(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await apiClient(endpoint, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function getDataFeedStatus() {
  return apiGet<{ feeds: Array<{ id: number; name: string; status: string; last_run: string | null; next_run: string | null }> }>('/api/data-feed/status');
}

export async function getDataFeedOverview() {
  return apiGet<{ 
    total_tweets_processed: number; 
    total_crises_detected: number; 
    most_recent_crisis: { name: string; date: string; bluesky_url: string | null; severity: string } | null 
  }>('/api/data-feed/overview');
}

export async function getWeeklyCrises(days = 7, page = 1, pageSize = 10, search = "") {
  const params = new URLSearchParams({
    days: days.toString(),
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  
  if (search && search.trim()) {
    params.append('search', search.trim());
  }
  
  return apiGet<{ 
    crises: Array<{
      id: number;
      crisis_name: string;
      date: string;
      region: string;
      severity: string;
      tweets_analyzed: number;
      status: string;
      description: string;
      sentiment?: string | null;
      sentiment_score?: number | null;
      disaster_type: string;
      bluesky_url: string | null;
    }>;
    pagination: {
      page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    }
  }>(`/api/data-feed/weekly-crises?${params.toString()}`);
}

// Analysis API functions
export async function getAnalysisKeyMetrics(country?: string, disasterType?: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (country) params.append('country', country);
  if (disasterType) params.append('disaster_type', disasterType);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const queryString = params.toString();
  
  return apiGet<{
    total_incidents: number;
    high_priority: number;
    response_rate: number;
    avg_response_time: number;
    tweets_recognized: number;
    prediction_accuracy: number;
    anomalies_detected: number;
  }>(`/api/analysis/key-metrics${queryString ? `?${queryString}` : ''}`);
}

export async function getAnalysisTrends(days = 365, country?: string, disasterType?: string) {
  const params = new URLSearchParams();
  params.append('days', days.toString());
  if (country) params.append('country', country);
  if (disasterType) params.append('disaster_type', disasterType);
  
  return apiGet<Array<{
    date: string;
    high_priority: number;
    medium_priority: number;
    total_incidents: number;
  }>>(`/api/analysis/crisis-trends?${params.toString()}`);
}

export async function getAnalysisRegionalAnalysis(country?: string, disasterType?: string) {
  const params = new URLSearchParams();
  if (country) params.append('country', country);
  if (disasterType) params.append('disaster_type', disasterType);
  const queryString = params.toString();
  
  return apiGet<Array<{
    region: string;
    incident_count: number;
    severity: string;
    coordinates: [number, number];
  }>>(`/api/analysis/regional-analysis${queryString ? `?${queryString}` : ''}`);
}

export async function getAnalysisStatistics(country?: string, disasterType?: string) {
  const params = new URLSearchParams();
  if (country) params.append('country', country);
  if (disasterType) params.append('disaster_type', disasterType);
  const queryString = params.toString();
  
  return apiGet<{
    tweets_recognized: number;
    prediction_accuracy: number;
    anomalies_detected: number;
    total_affected_population: number;
    sentiment_breakdown: {
      positive: number;
      negative: number;
      neutral: number;
      urgent: number;
      fearful: number;
    };
  }>(`/api/analysis/statistics${queryString ? `?${queryString}` : ''}`);
}

export async function getAnalysisPatterns(country?: string, disasterType?: string) {
  const params = new URLSearchParams();
  if (country) params.append('country', country);
  if (disasterType) params.append('disaster_type', disasterType);
  const queryString = params.toString();
  
  return apiGet<{
    recurring_patterns: {
      count: number;
    };
    pattern_types: {
      [key: string]: number;
    };
  }>(`/api/analysis/patterns${queryString ? `?${queryString}` : ''}`);
}

export async function getAnalysisFilterOptions() {
  return apiGet<{
    countries: string[];
    disaster_types: string[];
  }>('/api/analysis/filter-options');
}
