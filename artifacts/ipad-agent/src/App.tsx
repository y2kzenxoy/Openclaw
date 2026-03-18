import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BottomNav } from "@/components/BottomNav";
import { ChatPanel } from "@/pages/ChatPanel";
import { TerminalPanel } from "@/pages/TerminalPanel";
import { BrowserPanel } from "@/pages/BrowserPanel";
import { FilesPanel } from "@/pages/FilesPanel";
import { CameraPanel } from "@/pages/CameraPanel";
import { SettingsPanel } from "@/pages/SettingsPanel";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 pb-20 relative">
        <Switch>
          <Route path="/" component={ChatPanel} />
          <Route path="/terminal" component={TerminalPanel} />
          <Route path="/browser" component={BrowserPanel} />
          <Route path="/files" component={FilesPanel} />
          <Route path="/camera" component={CameraPanel} />
          <Route path="/settings" component={SettingsPanel} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
