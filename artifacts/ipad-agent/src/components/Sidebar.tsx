import { useLocation } from "wouter";
import { MessageSquare, Terminal, Globe, FolderOpen, Camera, Settings, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/",         icon: MessageSquare, label: "Chat",     title: "Agent Chat" },
  { path: "/terminal", icon: Terminal,      label: "Terminal", title: "Secure Shell" },
  { path: "/browser",  icon: Globe,         label: "Browser",  title: "Net Runner" },
  { path: "/files",    icon: FolderOpen,    label: "Files",    title: "Data Core" },
  { path: "/camera",   icon: Camera,        label: "Camera",   title: "Optic Sensor" },
  { path: "/settings", icon: Settings,      label: "Config",   title: "System Config" },
];

interface SidebarProps {
  agentStatus: "idle" | "working" | "error";
}

export function Sidebar({ agentStatus }: SidebarProps) {
  const [location, setLocation] = useLocation();

  const statusDot =
    agentStatus === "working" ? "dot-green dot-pulse"
    : agentStatus === "error"   ? "dot-red"
    : "dot-yellow";

  return (
    <aside className="hidden md:flex flex-col w-[72px] lg:w-[200px] flex-shrink-0 bg-sidebar border-r border-sidebar-border h-full">
      {/* Logo */}
      <div className="h-12 flex items-center gap-2.5 px-4 border-b border-sidebar-border">
        <Cpu className="w-5 h-5 text-primary flex-shrink-0" />
        <span className="hidden lg:block text-sm font-semibold text-foreground tracking-tight truncate">
          AgentLink
        </span>
      </div>

      {/* Agent status */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1">
          <span className={cn("flex-shrink-0", statusDot)} />
          <span className="hidden lg:block text-xs text-muted-foreground capitalize truncate">
            Agent {agentStatus}
          </span>
        </div>
      </div>

      {/* Sessions label */}
      <div className="px-3 pt-4 pb-1">
        <p className="hidden lg:block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Panels
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              title={item.title}
              className={cn(
                "w-full flex items-center gap-3 px-2 py-2.5 rounded-md text-sm transition-colors min-h-[44px]",
                active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", active && "text-primary")} />
              <span className="hidden lg:block truncate">{item.label}</span>
              {active && (
                <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="hidden lg:flex items-center gap-2 px-1">
          <span className="dot-green" />
          <span className="text-xs text-muted-foreground truncate">Groq API connected</span>
        </div>
      </div>
    </aside>
  );
}
