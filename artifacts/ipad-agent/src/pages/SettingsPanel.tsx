import React, { useState, useEffect } from "react";
import { Settings, Save, Smartphone, ShieldAlert } from "lucide-react";
import { useGetSettings, useUpdateSettings, useGetSetupGuide } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";

export function SettingsPanel() {
  const { data: settings, isLoading: loadingSettings } = useGetSettings();
  const { data: guide } = useGetSetupGuide();
  const updateMutation = useUpdateSettings();

  const [form, setForm] = useState({
    llmModel: "deepseek-r1-distill-llama-70b",
    sshHost: "",
    sshPort: 22,
    sshUsername: "",
    sshPassword: "",
    enableCamera: true,
    enableTerminal: true,
    enableBrowser: true,
    enableFileAccess: true
  });

  useEffect(() => {
    if (settings) {
      setForm({
        ...form,
        ...settings,
        sshPassword: "", // Don't populate password
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ data: form });
  };

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-background p-4 sm:p-6 overflow-y-auto">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 text-primary">
          <Settings className="w-8 h-8" />
          <h1 className="text-2xl font-mono uppercase text-glow">System Config</h1>
        </div>
        <Button onClick={handleSubmit} disabled={updateMutation.isPending} variant="terminal">
          <Save className="w-4 h-4 mr-2" /> COMMIT
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Settings Form */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <form id="settings-form" className="glass-panel p-6 rounded-2xl border border-primary/20 space-y-6">
            <div>
              <h3 className="font-mono text-lg text-primary mb-4 border-b border-primary/20 pb-2">AI_CORE_PARAMETERS</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground block mb-1">LLM_MODEL</label>
                  <Input 
                    value={form.llmModel} 
                    onChange={e => setForm({...form, llmModel: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-mono text-lg text-primary mb-4 border-b border-primary/20 pb-2">SSH_CONNECTION</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-mono text-muted-foreground block mb-1">HOST</label>
                  <Input 
                    value={form.sshHost || ''} 
                    onChange={e => setForm({...form, sshHost: e.target.value})}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-mono text-muted-foreground block mb-1">PORT</label>
                  <Input 
                    type="number"
                    value={form.sshPort || 22} 
                    onChange={e => setForm({...form, sshPort: parseInt(e.target.value) || 22})}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-mono text-muted-foreground block mb-1">USERNAME</label>
                  <Input 
                    value={form.sshUsername || ''} 
                    onChange={e => setForm({...form, sshUsername: e.target.value})}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-mono text-muted-foreground block mb-1">PASSWORD (Optional)</label>
                  <Input 
                    type="password"
                    value={form.sshPassword} 
                    onChange={e => setForm({...form, sshPassword: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-mono text-lg text-primary mb-4 border-b border-primary/20 pb-2">MODULE_TOGGLES</h3>
              <div className="grid grid-cols-2 gap-4">
                {['Terminal', 'Browser', 'Camera', 'FileAccess'].map(mod => {
                  const key = `enable${mod}` as keyof typeof form;
                  return (
                    <div key={mod} className="flex items-center justify-between p-3 bg-black rounded border border-primary/10">
                      <span className="font-mono text-sm">{mod.toUpperCase()}</span>
                      <button
                        type="button"
                        onClick={() => setForm({...form, [key]: !form[key]})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${form[key] ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${form[key] ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Right Col - iPad Setup Guide */}
        <div className="col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-primary/20 text-center">
            <Smartphone className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-mono text-lg text-primary mb-2">DEVICE_PAIRING</h3>
            <p className="text-sm text-muted-foreground mb-6 font-mono">Scan QR code with iPad to link device securely.</p>
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <QRCodeSVG value={appUrl} size={160} fgColor="#000000" bgColor="#ffffff" />
            </div>
            <p className="text-xs font-mono text-primary/50 break-all">{appUrl}</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-primary/20">
            <h3 className="font-mono text-lg text-primary mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> SETUP_INSTRUCTIONS
            </h3>
            <div className="space-y-4 font-mono text-sm">
              {guide?.steps?.map((step, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute left-0 top-0 text-primary">{step.step}.</div>
                  <strong className="text-foreground block mb-1">{step.title}</strong>
                  <span className="text-muted-foreground">{step.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
