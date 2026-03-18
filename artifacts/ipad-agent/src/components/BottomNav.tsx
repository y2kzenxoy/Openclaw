import { useLocation } from "wouter";
import { MessageSquare, Terminal, Globe, FolderOpen, Camera, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/",         icon: MessageSquare, label: "Chat" },
  { path: "/terminal", icon: Terminal,      label: "Terminal" },
  { path: "/browser",  icon: Globe,         label: "Browser" },
  { path: "/files",    icon: FolderOpen,    label: "Files" },
  { path: "/camera",   icon: Camera,        label: "Camera" },
  { path: "/settings", icon: Settings,      label: "Config" },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-card border-t border-border z-50 flex items-stretch px-1">
      {NAV_ITEMS.map((item) => {
        const active = location === item.path;
        return (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 gap-1 min-h-[48px] min-w-[48px] rounded-md mx-0.5 my-1.5 transition-colors",
              active
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
            <span className={cn("text-[10px] font-medium", active ? "text-primary" : "")}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
