import { useState } from "react";
import {
  Camera, Mic, MapPin, Bell, Clipboard, HardDrive, Zap, Activity,
  Bluetooth, Mic2, Fingerprint, Wifi, Sun, ChevronRight, Shield, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const PERMISSION_CARDS = [
  { icon: Camera, label: "Camera",          desc: "Capture and analyze images in real time with AI." },
  { icon: Mic,    label: "Microphone",      desc: "Voice input, Whisper transcription, conversation mode." },
  { icon: MapPin, label: "Location",        desc: "Location-aware answers, map widget, GPS context." },
  { icon: Bell,   label: "Notifications",   desc: "Task completion alerts, agent input requests." },
  { icon: Clipboard, label: "Clipboard",    desc: "Auto-paste clipboard into chat, AI reads copied text." },
  { icon: HardDrive, label: "Storage",      desc: "Persist conversations and memory between sessions." },
  { icon: Zap,    label: "Wake Lock",       desc: "Prevent iPad from sleeping during long agent tasks." },
  { icon: Activity, label: "Motion",        desc: "Accelerometer and gyroscope for sensor context." },
  { icon: Mic2,   label: "Speech",          desc: "Voice control and text-to-speech agent responses." },
  { icon: Wifi,   label: "Network",         desc: "Offline mode, reconnect handling, speed indicator." },
  { icon: Fingerprint, label: "Biometrics", desc: "Lock app with Face ID / Touch ID for security." },
  { icon: Sun,    label: "Screen Capture",  desc: "Screenshots by AI agent for browser automation." },
  { icon: Bluetooth, label: "Bluetooth",   desc: "Scan nearby devices, reference them in chat." },
];

interface PermissionsOnboardingProps {
  onDone: () => void;
}

export function PermissionsOnboarding({ onDone }: PermissionsOnboardingProps) {
  const [step, setStep] = useState<"explain" | "requesting" | "done">("explain");
  const [progress, setProgress] = useState(0);
  const { requestAll, markOnboardingDone } = usePermissions();

  const handleGrantAll = async () => {
    setStep("requesting");
    // Simulate progress while requesting
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 8, 90));
    }, 300);
    await requestAll();
    clearInterval(interval);
    setProgress(100);
    setTimeout(() => {
      setStep("done");
    }, 600);
  };

  const handleSkip = () => {
    markOnboardingDone();
    onDone();
  };

  const handleFinish = () => {
    markOnboardingDone();
    onDone();
  };

  if (step === "done") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">All set!</h2>
        <p className="text-muted-foreground text-sm max-w-sm mb-8">
          AgentLink has the permissions it needs. You can review or change them anytime in Settings → Permissions.
        </p>
        <Button size="lg" onClick={handleFinish} className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 gap-2">
          Open AgentLink <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (step === "requesting") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-6" />
        <p className="text-lg font-medium text-foreground mb-2">Requesting permissions…</p>
        <p className="text-sm text-muted-foreground mb-6">Please approve each prompt that appears.</p>
        <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">{progress}%</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-5">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Welcome to AgentLink</h1>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            To give your AI agent full control over your iPad, we need a few permissions. 
            Everything stays on your device — nothing is shared without your consent.
          </p>
        </div>

        {/* Permission cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {PERMISSION_CARDS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="panel p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 items-center">
          <Button
            size="lg"
            onClick={handleGrantAll}
            className="w-full max-w-sm h-13 text-base bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Shield className="w-5 h-5" />
            Grant All Permissions
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Skip for now — I'll set up later
          </Button>
          <p className="text-[11px] text-muted-foreground text-center max-w-xs mt-1">
            You can always manage permissions in Settings → Permissions. Denied permissions just disable that feature — the app always works.
          </p>
        </div>
      </div>
    </div>
  );
}
