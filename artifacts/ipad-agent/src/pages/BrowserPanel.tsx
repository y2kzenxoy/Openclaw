import React, { useState } from "react";
import { Globe, Navigation, MousePointerClick, FileText, Camera as CameraIcon, LayoutTemplate } from "lucide-react";
import { 
  useBrowserNavigate, 
  useBrowserAction, 
  useBrowserScreenshot, 
  useGetBrowserStatus,
  BrowserActionRequestAction
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";

export function BrowserPanel() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [selector, setSelector] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const { data: status } = useGetBrowserStatus({
    query: { refetchInterval: 3000 }
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/browser/status"] });

  const navMutation = useBrowserNavigate({ mutation: { onSuccess: invalidate }});
  const actionMutation = useBrowserAction({ mutation: { onSuccess: invalidate }});
  const shotMutation = useBrowserScreenshot({
    mutation: {
      onSuccess: (data) => {
        if (data.imageData) setScreenshot(data.imageData);
        invalidate();
      }
    }
  });

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let target = url;
    if (!url.startsWith('http')) target = `https://${url}`;
    navMutation.mutate({ data: { url: target } });
  };

  const handleAction = (action: BrowserActionRequestAction) => {
    actionMutation.mutate({ data: { action, selector } });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-background p-4 sm:p-6 overflow-y-auto">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 text-primary">
          <Globe className="w-8 h-8" />
          <h1 className="text-2xl font-mono uppercase text-glow">Net Runner</h1>
        </div>
        <div className="text-xs font-mono px-3 py-1 rounded bg-secondary border border-primary/20">
          STATUS: {status?.active ? <span className="text-green-500 animate-pulse">ACTIVE</span> : <span className="text-muted-foreground">IDLE</span>}
        </div>
      </header>

      {/* URL Bar */}
      <form onSubmit={handleGo} className="flex gap-2 mb-6">
        <Input 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter target URL..."
          className="bg-card text-lg"
        />
        <Button type="submit" disabled={navMutation.isPending} variant="terminal" className="w-24">
          <Navigation className="w-5 h-5 mr-2" />
          GO
        </Button>
      </form>

      {/* Status Card */}
      <div className="glass-panel rounded-xl p-4 mb-6">
        <h3 className="font-mono text-sm text-primary/70 mb-2">CURRENT SESSION</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
          <div>
            <span className="text-muted-foreground">URL: </span>
            <span className="text-primary break-all">{status?.currentUrl || 'None'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">TITLE: </span>
            <span className="text-primary">{status?.currentTitle || 'None'}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-muted-foreground">LAST ACTION: </span>
            <span className="text-primary">{status?.lastAction || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass-panel rounded-xl p-4 flex flex-col gap-4">
          <h3 className="font-mono text-sm text-primary/70">AUTOMATION DIRECTIVES</h3>
          
          <div className="flex gap-2">
            <Input 
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder="CSS Selector (e.g. #submit-btn)"
              className="bg-background"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleAction(BrowserActionRequestAction.click)}
              disabled={!selector || actionMutation.isPending}
            >
              <MousePointerClick className="w-4 h-4 mr-2" /> Click
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleAction(BrowserActionRequestAction.scrape)}
              disabled={actionMutation.isPending}
            >
              <FileText className="w-4 h-4 mr-2" /> Extract text
            </Button>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 flex flex-col gap-4">
          <h3 className="font-mono text-sm text-primary/70">VISUAL TELEMETRY</h3>
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => shotMutation.mutate()}
            disabled={shotMutation.isPending}
          >
            <CameraIcon className="w-5 h-5 mr-2" />
            Capture Viewport
          </Button>
          
          <Button 
            variant="secondary" 
            className="w-full bg-secondary text-primary hover:bg-secondary/80 border border-primary/20"
            onClick={() => window.open(`shortcuts://run-shortcut?name=AgentSafariWebhook`, '_blank')}
          >
            <LayoutTemplate className="w-5 h-5 mr-2" />
            Trigger iOS Shortcut
          </Button>
        </div>
      </div>

      {/* Screenshot Preview */}
      {screenshot && (
        <div className="mt-4 border border-primary/30 rounded-xl overflow-hidden glass-panel">
          <div className="bg-secondary p-2 font-mono text-xs border-b border-primary/30">
            VIEWPORT_CAPTURE.PNG
          </div>
          <img 
            src={`data:image/png;base64,${screenshot}`} 
            alt="Browser Screenshot" 
            className="w-full h-auto object-contain"
          />
        </div>
      )}
    </div>
  );
}
