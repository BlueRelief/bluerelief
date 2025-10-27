import { toast } from "sonner";

// Alert severity levels
export const ALERT_SEVERITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
  EMERGENCY: 5,
} as const;

export type AlertSeverity = typeof ALERT_SEVERITY[keyof typeof ALERT_SEVERITY];

// Alert interface matching backend structure
export interface CrisisAlert {
  id: number;
  title: string;
  message: string;
  alert_type: string;
  severity: AlertSeverity;
  created_at: string;
  alert_metadata?: {
    location?: string;
    latitude?: number;
    longitude?: number;
    disaster_type?: string;
  };
}

// Toast utility functions
export const showCrisisAlert = (alert: CrisisAlert, onViewDetails?: () => void) => {
  // Determine toast type based on severity
  const getToastType = (severity: AlertSeverity) => {
    if (severity >= ALERT_SEVERITY.CRITICAL) return "error";
    if (severity >= ALERT_SEVERITY.HIGH) return "warning";
    return "info";
  };

  // Get appropriate icon/emoji
  const getAlertIcon = (alertType: string, severity: AlertSeverity) => {
    if (severity >= ALERT_SEVERITY.CRITICAL) return "🚨";
    if (severity >= ALERT_SEVERITY.HIGH) return "⚠️";
    
    switch (alertType.toLowerCase()) {
      case "earthquake": return "🌍";
      case "hurricane": return "🌀";
      case "flood": return "🌊";
      case "wildfire": return "🔥";
      case "tornado": return "🌪️";
      default: return "📢";
    }
  };

  const toastType = getToastType(alert.severity);
  const icon = getAlertIcon(alert.alert_type, alert.severity);
  const location = alert.alert_metadata?.location || "Unknown Location";
  
  // Format timestamp
  const timestamp = new Date(alert.created_at).toLocaleTimeString();
  
  // Truncate message if too long
  const truncatedMessage = alert.message.length > 100 
    ? `${alert.message.substring(0, 100)}...` 
    : alert.message;

  const toastConfig = {
    description: `${icon} ${truncatedMessage}\n📍 ${location} • ${timestamp}`,
    action: onViewDetails ? {
      label: "View Details",
      onClick: onViewDetails,
    } : undefined,
    duration: alert.severity >= ALERT_SEVERITY.CRITICAL ? 10000 : 7000, // Longer for critical alerts
  };

  // Show appropriate toast based on severity
  switch (toastType) {
    case "error":
      toast.error(`🚨 CRISIS ALERT: ${alert.title}`, toastConfig);
      break;
    case "warning":
      toast.warning(`⚠️ ${alert.title}`, toastConfig);
      break;
    case "info":
    default:
      toast.info(`📢 ${alert.title}`, toastConfig);
      break;
  }
};

export const showSuccessToast = (message: string, action?: { label: string; onClick: () => void }) => {
  toast.success(message, {
    duration: 5000,
    ...(action && { action }),
  });
};

export const showErrorToast = (message: string, action?: { label: string; onClick: () => void }) => {
  toast.error(message, {
    duration: 7000,
    ...(action && { action }),
  });
};

export const showWarningToast = (message: string, action?: { label: string; onClick: () => void }) => {
  toast.warning(message, {
    duration: 6000,
    ...(action && { action }),
  });
};

export const showInfoToast = (message: string, action?: { label: string; onClick: () => void }) => {
  toast.info(message, {
    duration: 5000,
    ...(action && { action }),
  });
};

// Specific alert type handlers
export const showNewCrisisAlert = (alert: CrisisAlert) => {
  if (alert.severity >= ALERT_SEVERITY.CRITICAL) {
    showCrisisAlert(alert);
  }
};

export const showSeverityChangeAlert = (alert: CrisisAlert, oldSeverity: AlertSeverity) => {
  const severityChanged = alert.severity !== oldSeverity;
  if (severityChanged && alert.severity >= ALERT_SEVERITY.MEDIUM) {
    showCrisisAlert(alert);
  }
};

export const showCrisisUpdateAlert = (alert: CrisisAlert) => {
  if (alert.severity < ALERT_SEVERITY.HIGH) {
    showCrisisAlert(alert);
  }
};

// Utility for dismissing all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Utility for custom toast with full control
export const showCustomToast = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  description?: string,
  options?: {
    duration?: number;
    action?: { label: string; onClick: () => void };
    onDismiss?: () => void;
  }
) => {
  const config = {
    description,
    duration: options?.duration || 5000,
    ...(options?.action && { action: options.action }),
    ...(options?.onDismiss && { onDismiss: options.onDismiss }),
  };

  switch (type) {
    case "success":
      toast.success(title, config);
      break;
    case "error":
      toast.error(title, config);
      break;
    case "warning":
      toast.warning(title, config);
      break;
    case "info":
    default:
      toast.info(title, config);
      break;
  }
};
