import React, { useState } from "react";
import { Globe, Navigation, MousePointerClick, FileText, Camera as CameraIcon, LayoutTemplate, ExternalLink } from "lucide-react";
import {
  useBrowserNavigate,
  useBrowserAction,
  useBrowserScreenshot,
  useGetBrowserStatus,
  BrowserActionRequestAction,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function BrowserPanel() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [selector, setSelector] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const { data: status } = useGetBrowserStatus({ query: { refetchInterval: 3000 } });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/browser/status"] });

  const navMutation    = useBrowserNavigate({ mutation: { onSuccess: invalidate } });
  const actionMutation = useBrowserAction({ mutation: { onSuccess: invalidate } });
  const shotMutation   = useBrowserScreenshot({
    mutation: {
      onSuccess: (data) => {
        if (data.imageData) setScreenshot(data.imageData);
        invalidate();
      },
    },
  });

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    const target = url.startsWith("http") ? url : `https://${url}`;
    navMutation.mutate({ data: { url: target } });
  };

  const handleAction = (action: BrowserActionRequestAction) => {
    actionMutation.mutate({ data: { action, selector } });
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-card flex items-center gap-3">
        <Globe className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm font-medium text-foreground hidden sm:block">Browser Control</span>
        <span className={cn(
          "px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
          status?.active ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
        )}>
          {status?.active ? "Active" : "Idle"}
        </span>
        {status?.currentUrl && (
          <a
            href={status.currentUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground truncate max-w-[200px]"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{status.currentUrl}</span>
          </a>
        )}
      </div>

      <div className="flex-1 p-4 sm:p-6 space-y-5">
        {/* URL bar */}
        <form onSubmit={handleGo} className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-card border-border"
          />
          <Button type="submit" disabled={navMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
            <Navigation className="w-4 h-4" />
            Go
          </Button>
        </form>

        {/* Status row */}
        {(status?.currentUrl || status?.currentTitle) && (
          <div className="panel p-3 text-sm space-y-1">
            <div className="flex gap-2">
              <span className="text-muted-foreground text-xs w-12 flex-shrink-0 pt-0.5">URL</span>
              <span className="text-foreground break-all text-xs">{status?.currentUrl || "—"}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground text-xs w-12 flex-shrink-0 pt-0.5">Title</span>
              <span className="text-foreground text-xs truncate">{status?.currentTitle || "—"}</span>
            </div>
            {status?.lastAction && (
              <div className="flex gap-2">
                <span className="text-muted-foreground text-xs w-12 flex-shrink-0 pt-0.5">Action</span>
                <span className="text-muted-foreground text-xs truncate">{status.lastAction}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Automation */}
          <div className="panel p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Automation</p>
            <Input
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder="CSS selector, e.g. #submit"
              className="bg-background border-border text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction(BrowserActionRequestAction.click)}
                disabled={!selector || actionMutation.isPending}
                className="gap-1.5 h-10"
              >
                <MousePointerClick className="w-4 h-4" /> Click
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction(BrowserActionRequestAction.scrape)}
                disabled={actionMutation.isPending}
                className="gap-1.5 h-10"
              >
                <FileText className="w-4 h-4" /> Scrape
              </Button>
            </div>
          </div>

          {/* Capture */}
          <div className="panel p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capture</p>
            <Button
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              onClick={() => shotMutation.mutate()}
              disabled={shotMutation.isPending}
            >
              <CameraIcon className="w-4 h-4" />
              Screenshot
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 gap-1.5"
              onClick={() => window.open(`shortcuts://run-shortcut?name=AgentSafariWebhook`, "_blank")}
            >
              <LayoutTemplate className="w-4 h-4" />
              iOS Shortcut
            </Button>
          </div>
        </div>

        {/* Screenshot preview */}
        {screenshot && (
          <div className="panel overflow-hidden">
            <div className="px-3 py-2 border-b border-border text-xs text-muted-foreground flex items-center gap-2">
              <CameraIcon className="w-3.5 h-3.5" /> Screenshot
            </div>
            <img
              src={screenshot.startsWith("data:") ? screenshot : `data:image/jpeg;base64,${screenshot}`}
              alt="Browser screenshot"
              className="w-full h-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}
