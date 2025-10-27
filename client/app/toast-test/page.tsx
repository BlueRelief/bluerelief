"use client"

import { Button } from "@/components/ui/button";
import { showCrisisAlert, showSuccessToast, showErrorToast, showWarningToast, showInfoToast, CrisisAlert, ALERT_SEVERITY } from "@/lib/toast-utils";
import { useRouter } from "next/navigation";

export default function ToastTestPage() {
  const router = useRouter();

  const testCrisisAlert = () => {
    const mockAlert: CrisisAlert = {
      id: 999,
      title: "Test Crisis Alert",
      message: "This is a test crisis alert to demonstrate the toast notification system. Flooding detected in Dallas area with severe weather conditions.",
      alert_type: "flood",
      severity: ALERT_SEVERITY.CRITICAL,
      created_at: new Date().toISOString(),
      alert_metadata: {
        location: "Dallas, TX",
        latitude: 32.7767,
        longitude: -96.7970,
        disaster_type: "flood"
      }
    };
    showCrisisAlert(mockAlert, () => router.push("/dashboard/alerts"));
  };

  const testSuccessToast = () => {
    showSuccessToast("Preferences saved successfully!", {
      label: "View Settings",
      onClick: () => console.log("Navigate to settings")
    });
  };

  const testErrorToast = () => {
    showErrorToast("Failed to load crisis data", {
      label: "Retry",
      onClick: () => console.log("Retry loading")
    });
  };

  const testWarningToast = () => {
    showWarningToast("Severity change detected", {
      label: "View Details",
      onClick: () => console.log("View alert details")
    });
  };

  const testInfoToast = () => {
    showInfoToast("New crisis update available", {
      label: "Refresh",
      onClick: () => console.log("Refresh data")
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Toast Notification Test Page</h1>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button onClick={testCrisisAlert} variant="destructive">
              Test Crisis Alert
            </Button>
            <Button onClick={testSuccessToast} variant="default">
              Test Success
            </Button>
            <Button onClick={testErrorToast} variant="destructive">
              Test Error
            </Button>
            <Button onClick={testWarningToast} variant="secondary">
              Test Warning
            </Button>
            <Button onClick={testInfoToast} variant="outline">
              Test Info
            </Button>
          </div>
          
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click any button above to test different toast types</li>
              <li>Toasts should appear in the top-right corner</li>
              <li>Different colors for different severities</li>
              <li>Action buttons should work when clicked</li>
              <li>Toasts auto-dismiss after a few seconds</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
