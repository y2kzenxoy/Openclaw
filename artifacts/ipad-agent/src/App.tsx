import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Sidebar } from "@/components/Sidebar";
import { GatewayBar } from "@/components/GatewayBar";
import { BottomNav } from "@/components/BottomNav";
import { PermissionsOnboarding } from "@/components/PermissionsOnboarding";
import { NetworkStatusBar } from "@/components/NetworkStatusBar";
import { ChatPanel } from "@/pages/ChatPanel";
import { TerminalPanel } from "@/pages/TerminalPanel";
import { BrowserPanel } from "@/pages/BrowserPanel";
import { FilesPanel } from "@/pages/FilesPanel";
import { CameraPanel } from "@/pages/CameraPanel";
import { SettingsPanel } from "@/pages/SettingsPanel";
import NotFound from "@/pages/not-found";

import { usePermissions } from "@/hooks/usePermissions";
import { useWakeLock } from "@/hooks/useDeviceStatus";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type AgentStatus = "idle" | "working" | "error";

function AppLayout() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");
  const [location] = useLocation();
  const { onboardingDone, markOnboardingDone } = usePermissions();
  const { acquire } = useWakeLock();

  // Request wake lock once permissions are sorted
  useEffect(() => {
    if (onboardingDone) {
      acquire();
    }
  }, [onboardingDone]);

  // Request fullscreen on iOS by adding to home screen meta is handled in index.html
  // Ensure the app is never sleeping while in use

  if (!onboardingDone) {
    return <PermissionsOnboarding onDone={markOnboardingDone} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Left sidebar — hidden on mobile */}
      <Sidebar agentStatus={agentStatus} />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Gateway status bar */}
        <GatewayBar agentStatus={agentStatus} currentPanel={location} />

        {/* Offline/battery bar (conditionally rendered) */}
        <NetworkStatusBar />

        {/* Panel content */}
        <main className="flex-1 overflow-hidden pb-[80px] md:pb-0">
          <Switch>
            <Route path="/" component={() => <ChatPanel onStatusChange={setAgentStatus} />} />
            <Route path="/terminal" component={TerminalPanel} />
            <Route path="/browser" component={BrowserPanel} />
            <Route path="/files" component={FilesPanel} />
            <Route path="/camera" component={CameraPanel} />
            <Route path="/settings" component={SettingsPanel} />
            <Route component={NotFound} />
          </Switch>
        </main>

        {/* Bottom nav — visible only on mobile */}
        <BottomNav />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppLayout />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
