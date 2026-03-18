import { useLocation } from "wouter";
import { MessageSquare, Terminal, Globe, FolderOpen, Camera, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", icon: MessageSquare, label: "Chat" },
  { path: "/terminal", icon: Terminal, label: "Terminal" },
  { path: "/browser", icon: Globe, label: "Browser" },
  { path: "/files", icon: FolderOpen, label: "Files" },
  { path: "/camera", icon: Camera, label: "Camera" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-card/90 backdrop-blur-xl border-t border-primary/20 z-50 px-4 pb-safe flex items-center justify-around">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.path;
        return (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] min-h-[64px] rounded-xl transition-all duration-300",
              isActive ? "text-primary scale-110 terminal-glow-strong" : "text-muted-foreground hover:text-primary/70 hover:bg-primary/5"
            )}
          >
            <item.icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
            <span className={cn("text-[10px] font-mono", isActive ? "font-bold text-glow" : "")}>
              {item.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 w-8 h-1 rounded-t-md bg-primary shadow-[0_0_8px_#00ff41]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
