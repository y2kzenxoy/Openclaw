import { useState } from "react";
import {
  Camera, Mic, MapPin, Bell, Clipboard, HardDrive, Zap, Activity,
  Bluetooth, Mic2, Fingerprint, Wifi, Sun, Shield, ExternalLink, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, HelpCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions, type PermissionState, type PermissionStatus } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

type PermKey = keyof PermissionState;

interface PermInfo {
  key: PermKey;
  icon: React.ElementType;
  label: string;
  desc: string;
  usedFor: string;
}

const PERMISSIONS: PermInfo[] = [
  { key: "camera",        icon: Camera,       label: "Camera",          desc: "Front and back camera access",                 usedFor: "Real-time image capture and AI vision analysis" },
  { key: "microphone",    icon: Mic,          label: "Microphone",      desc: "Audio recording",                              usedFor: "Voice input, audio transcription via Whisper" },
  { key: "location",      icon: MapPin,       label: "Location",        desc: "GPS coordinates and city",                     usedFor: "Location-aware AI answers, map widget" },
  { key: "notifications", icon: Bell,         label: "Notifications",   desc: "Push notifications",                           usedFor: "Task completion alerts, agent input requests" },
  { key: "clipboard",     icon: Clipboard,    label: "Clipboard",       desc: "Read and write clipboard",                     usedFor: "Auto-paste into chat, AI reads copied text" },
  { key: "storage",       icon: HardDrive,    label: "Persistent Storage", desc: "Permanent local storage",                   usedFor: "Never lose conversation history between sessions" },
  { key: "wakeLock",      icon: Zap,          label: "Screen Wake Lock", desc: "Prevent device sleep",                        usedFor: "Keep iPad awake during long-running agent tasks" },
  { key: "motion",        icon: Activity,     label: "Motion Sensors",  desc: "Accelerometer and gyroscope",                  usedFor: "Device orientation and sensor context for AI" },
  { key: "speech",        icon: Mic2,         label: "Speech",          desc: "Voice recognition and synthesis",              usedFor: "Voice control, text-to-speech agent responses" },
  { key: "screenCapture", icon: Sun,          label: "Screen Capture",  desc: "Capture screen content",                       usedFor: "Agent-triggered screenshots for browser tasks" },
  { key: "bluetooth",     icon: Bluetooth,    label: "Bluetooth",       desc: "Scan nearby Bluetooth devices",                usedFor: "Agent can reference and list nearby BT devices" },
  { key: "contacts",      icon: Clipboard,    label: "Contacts",        desc: "Access device contacts",                       usedFor: "AI can reference contacts by name in chat" },
  { key: "battery",       icon: Zap,          label: "Battery Status",  desc: "Battery level and charging state",             usedFor: "Adjust performance based on battery level" },
  { key: "backgroundSync",icon: Wifi,         label: "Background Sync", desc: "Background processing",                        usedFor: "Keep agent running when app is minimized" },
  { key: "biometrics",    icon: Fingerprint,  label: "Biometrics",      desc: "Face ID / Touch ID",                           usedFor: "Lock app, secure API key storage" },
];

function StatusDot({ status }: { status: PermissionStatus }) {
  if (status === "granted")     return <span className="dot-green" />;
  if (status === "denied")      return <span className="dot-red" />;
  if (status === "unavailable") return <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />;
  if (status === "unknown")     return <span className="dot-yellow dot-pulse" />;
  return <span className="dot-yellow" />;
}

function StatusLabel({ status }: { status: PermissionStatus }) {
  const cls: Record<PermissionStatus, string> = {
    granted:     "text-emerald-400",
    denied:      "text-red-400",
    prompt:      "text-yellow-400",
    unavailable: "text-muted-foreground",
    unknown:     "text-yellow-400",
  };
  const labels: Record<PermissionStatus, string> = {
    granted:     "Granted",
    denied:      "Denied",
    prompt:      "Not asked",
    unavailable: "Unavailable",
    unknown:     "Unknown",
  };
  return <span className={cn("text-[11px] font-medium", cls[status])}>{labels[status]}</span>;
}

export function PermissionsDashboard() {
  const { permissions, requestAll, requestByKey } = usePermissions();
  const [loading, setLoading] = useState<PermKey | "all" | null>(null);

  const handleRequest = async (key: PermKey) => {
    setLoading(key);
    await requestByKey(key);
    setLoading(null);
  };

  const handleRequestAll = async () => {
    setLoading("all");
    await requestAll();
    setLoading(null);
  };

  const granted = PERMISSIONS.filter(p => permissions[p.key] === "granted").length;
  const denied  = PERMISSIONS.filter(p => permissions[p.key] === "denied").length;
  const notAsked = PERMISSIONS.filter(p => permissions[p.key] === "prompt" || permissions[p.key] === "unknown").length;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="panel p-4 flex flex-wrap items-center gap-4 sm:gap-8">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-foreground font-medium">{granted} granted</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-foreground font-medium">{denied} denied</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-foreground font-medium">{notAsked} not asked</span>
        </div>
        <Button
          size="sm"
          onClick={handleRequestAll}
          disabled={!!loading}
          className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 h-9"
        >
          {loading === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
          Request All
        </Button>
      </div>

      {/* Permission rows */}
      <div className="panel overflow-hidden">
        <div className="divide-y divide-border">
          {PERMISSIONS.map(({ key, icon: Icon, label, desc, usedFor }) => {
            const status = permissions[key];
            const isLoading = loading === key;
            const canRequest = status !== "granted" && status !== "unavailable";

            return (
              <div key={key} className="flex items-start gap-4 px-4 py-3.5 hover:bg-accent/20 transition-colors">
                {/* Icon */}
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                  status === "granted"     ? "bg-emerald-500/12 border border-emerald-500/25" :
                  status === "denied"      ? "bg-red-500/12 border border-red-500/25" :
                  status === "unavailable" ? "bg-muted border border-border" :
                                             "bg-primary/10 border border-primary/20"
                )}>
                  <Icon className={cn("w-4 h-4",
                    status === "granted"     ? "text-emerald-400" :
                    status === "denied"      ? "text-red-400" :
                    status === "unavailable" ? "text-muted-foreground/40" :
                                               "text-primary"
                  )} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <StatusDot status={status} />
                    <StatusLabel status={status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5 italic">Used for: {usedFor}</p>
                </div>

                {/* Action */}
                <div className="flex-shrink-0 mt-0.5">
                  {status === "unavailable" ? (
                    <span className="text-[11px] text-muted-foreground/50">N/A on this device</span>
                  ) : status === "denied" ? (
                    <div className="flex flex-col items-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequest(key)}
                        disabled={isLoading}
                        className="h-7 text-xs gap-1"
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Retry
                      </Button>
                      <button
                        onClick={() => window.open("app-settings:", "_blank")}
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> Open Settings
                      </button>
                    </div>
                  ) : canRequest ? (
                    <Button
                      size="sm"
                      onClick={() => handleRequest(key)}
                      disabled={isLoading}
                      className="h-7 text-xs bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 gap-1"
                    >
                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                      Allow
                    </Button>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center px-2">
        If a permission is permanently denied, tap "Open Settings" to enable it in iOS Settings. 
        The app never crashes if a permission is unavailable — it simply disables that feature.
      </p>
    </div>
  );
}
