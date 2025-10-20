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

export async function getWeeklyCrises(days = 7, page = 1, pageSize = 10) {
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
  }>(`/api/data-feed/weekly-crises?days=${days}&page=${page}&page_size=${pageSize}`);
}

// Analysis API functions
export async function getAnalysisKeyMetrics() {
  return apiGet<{
    total_incidents: number;
    high_priority: number;
    response_rate: number;
    avg_response_time: number;
    tweets_recognized: number;
    prediction_accuracy: number;
    anomalies_detected: number;
  }>('/api/analysis/key-metrics');
}

export async function getAnalysisTrends(days = 365) {
  return apiGet<Array<{
    date: string;
    high_priority: number;
    medium_priority: number;
    total_incidents: number;
  }>>(`/api/analysis/crisis-trends?days=${days}`);
}

export async function getAnalysisRegionalAnalysis() {
  return apiGet<Array<{
    region: string;
    incident_count: number;
    severity: string;
    coordinates: [number, number];
  }>>('/api/analysis/regional-analysis');
}

export async function getAnalysisStatistics() {
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
  }>('/api/analysis/statistics');
}

export async function getAnalysisPatterns() {
  return apiGet<{
    recurring_patterns: {
      count: number;
    };
    pattern_types: {
      [key: string]: number;
    };
  }>('/api/analysis/patterns');
}
