"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiPost, apiGet } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

type TaskRecord = {
  id: string;
  status: string;
  last_checked?: string;
  result?: any;
};

export default function DevToolsPage() {
  const [includeEnhanced, setIncludeEnhanced] = useState(true);
  const [disasterTypes, setDisasterTypes] = useState<string[]>([]);
  const [daysThreshold, setDaysThreshold] = useState<number>(2);
  const [tasks, setTasks] = useState<Record<string, TaskRecord>>({});
  const pollingRef = useRef<number | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    // start polling running tasks
    pollingRef.current = window.setInterval(() => {
      Object.keys(tasks).forEach((tid) => pollTaskStatus(tid));
    }, 3000);

    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // stop polling if no tasks
    if (Object.keys(tasks).length === 0 && pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [tasks]);

  const showMsg = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchMetrics = async () => {
    try {
      const data = await apiGet<any>("/api/admin/tasks/metrics");
      setMetrics(data);
    } catch (e) {
      console.warn("Failed to fetch metrics", e);
    }
  };

  const startTask = (endpoint: string, body?: any) => async () => {
    try {
      const data = await apiPost<any>(endpoint, body ?? {});
      if (data?.task_id) {
        const id = data.task_id;
        setTasks((prev) => ({ ...prev, [id]: { id, status: "PENDING" } }));
        showMsg(`Started task ${id}`);
        pollTaskStatus(id);
      } else {
        showMsg("Task started (no id returned)");
      }
    } catch (e) {
      console.error(e);
      showMsg("Failed to start task");
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    try {
      const data = await apiGet<any>(`/api/admin/tasks/${taskId}`);
      setTasks((prev) => ({
        ...prev,
        [taskId]: {
          id: taskId,
          status: data.status,
          last_checked: new Date().toISOString(),
          result: data.result ?? prev[taskId]?.result,
        },
      }));
    } catch (e) {
      console.warn("Failed to poll task", taskId, e);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dev Tools</h1>
        {message && (
          <div className="px-3 py-1 rounded bg-primary/10 text-primary text-sm">{message}</div>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Run Data Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeEnhanced} onChange={(e) => setIncludeEnhanced(e.target.checked)} />
                Include enhanced data
              </label>
              <div className="flex gap-2">
                <Button onClick={startTask('/api/admin/tasks/collect', { include_enhanced: includeEnhanced, disaster_types: disasterTypes })}>Run Data Collection</Button>
                <Button variant="outline" onClick={() => { fetchMetrics(); showMsg('Metrics refreshed'); }}>Refresh Metrics</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button onClick={startTask('/api/admin/tasks/generate-alerts')}>Generate Alerts</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Process Alert Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button onClick={startTask('/api/admin/tasks/process-queue')}>Process Alert Queue</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Archive Disasters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input type="number" value={daysThreshold} onChange={(e) => setDaysThreshold(Number(e.target.value))} className="w-24" />
                <span className="text-sm text-muted-foreground">Days threshold</span>
              </div>
              <Button onClick={startTask('/api/admin/tasks/archive', { days_threshold: daysThreshold })}>Run Archive Process</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cleanup Old Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button onClick={startTask('/api/admin/tasks/cleanup-alerts')}>Cleanup Old Alerts</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button onClick={startTask('/api/bluesky/trigger')}>Force sync Bluesky posts</Button>
                <Button onClick={startTask('/api/admin/tasks/generate-alerts')}>Regenerate Alerts</Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={async () => { try { await apiPost('/api/admin/tasks/cleanup-alerts'); showMsg('Cleanup queued'); } catch { showMsg('Failed'); } }}>Cleanup Alerts</Button>
                <Button onClick={async () => { try { await apiPost('/api/archive/trigger', { days_threshold: 2 }); showMsg('Archive queued'); } catch { showMsg('Failed'); } }}>Archive (2d)</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-2 text-sm">
                <div>Total users: <strong>{metrics.total_users}</strong></div>
                <div>Active disasters: <strong>{metrics.active_disasters}</strong></div>
                <div>Pending alerts: <strong>{metrics.pending_alerts}</strong></div>
                <div>Last collection run: <strong>{metrics.last_collection_run ?? '—'}</strong></div>
                <div>DB health: <Badge variant={metrics.db_health ? 'outline' : 'destructive'}>{metrics.db_health ? 'OK' : 'Unhealthy'}</Badge></div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Loading metrics...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task History / Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.values(tasks).length === 0 ? (
                <div className="text-sm text-muted-foreground">No tasks started yet</div>
              ) : (
                <div className="space-y-2">
                  {Object.values(tasks).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="text-sm font-medium">{t.id}</div>
                        <div className="text-xs text-muted-foreground">Last checked: {t.last_checked ?? '—'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs`}>{t.status}</Badge>
                        <Button size="sm" onClick={() => pollTaskStatus(t.id)}>Refresh</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
