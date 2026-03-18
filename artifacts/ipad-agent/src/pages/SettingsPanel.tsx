import React, { useState, useEffect } from "react";
import { Save, Smartphone, Info, Shield } from "lucide-react";
import { useGetSettings, useUpdateSettings, useGetSetupGuide } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { PermissionsDashboard } from "@/components/PermissionsDashboard";
import { cn } from "@/lib/utils";

type Tab = "general" | "permissions";

export function SettingsPanel() {
  const [tab, setTab] = useState<Tab>("general");
  const { data: settings } = useGetSettings();
  const { data: guide } = useGetSetupGuide();
  const updateMutation = useUpdateSettings();

  const [form, setForm] = useState({
    llmModel: "llama-3.3-70b-versatile",
    sshHost: "",
    sshPort: 2222,
    sshUsername: "mobile",
    sshPassword: "",
    enableCamera: true,
    enableTerminal: true,
    enableBrowser: true,
    enableFileAccess: true,
  });

  useEffect(() => {
    if (settings) {
      setForm((prev) => ({ ...prev, ...settings, sshPassword: "" }));
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ data: form });
  };

  const toggle = (key: keyof typeof form) => setForm((f) => ({ ...f, [key]: !f[key] }));

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const TOGGLES = [
    { key: "enableTerminal" as const, label: "Terminal / SSH" },
    { key: "enableBrowser" as const, label: "Browser control" },
    { key: "enableCamera" as const, label: "Camera & vision" },
    { key: "enableFileAccess" as const, label: "File access" },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card">
        <Info className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">System Config</span>
        {tab === "general" && (
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            size="sm"
            className="ml-auto h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {updateMutation.isPending ? "Saving…" : "Save"}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-border bg-card/50">
        <button
          onClick={() => setTab("general")}
          className={cn(
            "px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            tab === "general"
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          )}
        >
          General
        </button>
        <button
          onClick={() => setTab("permissions")}
          className={cn(
            "px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5",
            tab === "permissions"
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          )}
        >
          <Shield className="w-3.5 h-3.5" />
          Permissions
        </button>
      </div>

      <div className="flex-1 p-4 sm:p-6">
        {tab === "permissions" ? (
          <PermissionsDashboard />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — Settings */}
            <div className="lg:col-span-2 space-y-5">
              {/* AI Core */}
              <div className="panel p-5 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Core</p>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">LLM Model</label>
                  <Input
                    value={form.llmModel}
                    onChange={(e) => setForm({ ...form, llmModel: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
              </div>

              {/* SSH */}
              <div className="panel p-5 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SSH Connection</p>
                <p className="text-xs text-muted-foreground">
                  Connect to your iPad's a-Shell app. Run <code className="text-primary">sshd</code> in a-Shell first.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-muted-foreground block mb-1.5">Host (iPad IP)</label>
                    <Input
                      value={form.sshHost || ""}
                      onChange={(e) => setForm({ ...form, sshHost: e.target.value })}
                      placeholder="192.168.1.100"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-muted-foreground block mb-1.5">Port</label>
                    <Input
                      type="number"
                      value={form.sshPort || 2222}
                      onChange={(e) => setForm({ ...form, sshPort: parseInt(e.target.value) || 2222 })}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-muted-foreground block mb-1.5">Username</label>
                    <Input
                      value={form.sshUsername || ""}
                      onChange={(e) => setForm({ ...form, sshUsername: e.target.value })}
                      placeholder="mobile"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-muted-foreground block mb-1.5">Password</label>
                    <Input
                      type="password"
                      value={form.sshPassword}
                      onChange={(e) => setForm({ ...form, sshPassword: e.target.value })}
                      placeholder="optional"
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Module toggles */}
              <div className="panel p-5 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modules</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TOGGLES.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(key)}
                      className="flex items-center justify-between px-3 py-3 rounded-md bg-muted/40 hover:bg-muted/70 border border-border transition-colors min-h-[48px]"
                    >
                      <span className="text-sm text-foreground">{label}</span>
                      <span className={cn(
                        "relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0",
                        form[key] ? "bg-primary" : "bg-muted"
                      )}>
                        <span className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
                          form[key] ? "left-4" : "left-0.5"
                        )} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-5">
              {/* QR code */}
              <div className="panel p-5 text-center">
                <Smartphone className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Device Pairing</p>
                <p className="text-xs text-muted-foreground mb-4">Scan on your iPad to open the app</p>
                <div className="inline-block bg-white p-3 rounded-lg mb-3">
                  <QRCodeSVG value={appUrl} size={140} fgColor="#000" bgColor="#fff" />
                </div>
                <p className="text-[10px] text-muted-foreground break-all font-mono">{appUrl}</p>
              </div>

              {/* Webhook URL */}
              {guide?.webhookUrl && (
                <div className="panel p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Safari Webhook</p>
                  <p className="text-[11px] font-mono text-primary break-all">{guide.webhookUrl}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Use this URL in your Apple Shortcut to send Safari data to the agent.
                  </p>
                </div>
              )}

              {/* Setup steps */}
              {guide?.steps && (
                <div className="panel p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">iPad Setup</p>
                  <ol className="space-y-3">
                    {guide.steps.map((step) => (
                      <li key={step.step} className="flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold flex items-center justify-center mt-0.5">
                          {step.step}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-foreground">{step.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                          {step.command && (
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-primary mt-1 inline-block break-all">
                              {step.command}
                            </code>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
