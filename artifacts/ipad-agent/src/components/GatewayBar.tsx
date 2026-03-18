import { useGetTerminalStatus, useGetBrowserStatus } from "@workspace/api-client-react";
import { Cpu, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface GatewayBarProps {
  agentStatus: "idle" | "working" | "error";
  currentPanel: string;
}

const PANEL_TITLES: Record<string, string> = {
  "/":         "Agent Chat",
  "/terminal": "Terminal",
  "/browser":  "Browser Control",
  "/files":    "File Manager",
  "/camera":   "Camera & Vision",
  "/settings": "System Config",
};

export function GatewayBar({ agentStatus, currentPanel }: GatewayBarProps) {
  const { data: termStatus } = useGetTerminalStatus({ query: { refetchInterval: 8000 } });
  const { data: browserStatus } = useGetBrowserStatus({ query: { refetchInterval: 5000 } });

  const apiConnected = true; // Groq key is always configured at startup

  return (
    <header className="h-12 flex-shrink-0 flex items-center justify-between px-4 bg-card border-b border-border">
      {/* Left: title */}
      <div className="flex items-center gap-2 min-w-0">
        <Cpu className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm font-medium truncate text-foreground">
          {PANEL_TITLES[currentPanel] ?? "AgentLink"}
        </span>
      </div>

      {/* Right: status indicators */}
      <div className="flex items-center gap-4">
        {/* Agent status */}
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            agentStatus === "working" ? "bg-emerald-500 dot-pulse"
            : agentStatus === "error"  ? "bg-red-500"
            : "bg-yellow-400"
          )} />
          <span className="text-xs text-muted-foreground hidden sm:block capitalize">
            {agentStatus === "working" ? "Processing" : agentStatus === "error" ? "Error" : "Idle"}
          </span>
        </div>

        {/* SSH terminal status */}
        <div className="flex items-center gap-1.5 hidden sm:flex">
          {termStatus?.connected ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {termStatus?.connected ? `SSH: ${termStatus.host || "local"}` : "SSH: offline"}
          </span>
        </div>

        {/* Browser status */}
        <div className="hidden md:flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full", browserStatus?.active ? "bg-blue-400" : "bg-muted-foreground")} />
          <span className="text-xs text-muted-foreground">
            {browserStatus?.active ? "Browser active" : "Browser idle"}
          </span>
        </div>

        {/* Groq API */}
        <div className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full", apiConnected ? "bg-emerald-500" : "bg-red-500")} />
          <span className="text-xs text-muted-foreground hidden sm:block">
            {apiConnected ? "Groq" : "Disconnected"}
          </span>
        </div>
      </div>
    </header>
  );
}
