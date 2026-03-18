import { useEffect, useState } from "react";
import { Wifi, WifiOff, Battery, BatteryCharging, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function NetworkStatusBar() {
  const [online, setOnline] = useState(navigator.onLine);
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [showOffline, setShowOffline] = useState(false);

  // Network
  useEffect(() => {
    const onOnline = () => { setOnline(true); };
    const onOffline = () => { setOnline(false); setShowOffline(true); setTimeout(() => setShowOffline(false), 4000); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  // Battery
  useEffect(() => {
    if (!(navigator as any).getBattery) return;
    (navigator as any).getBattery().then((b: any) => {
      const update = () => setBattery({ level: Math.round(b.level * 100), charging: b.charging });
      update();
      b.addEventListener("levelchange", update);
      b.addEventListener("chargingchange", update);
    }).catch(() => {});
  }, []);

  // Location (read from permissions storage if granted)
  useEffect(() => {
    const stored = localStorage.getItem("oc_permissions");
    if (!stored) return;
    try {
      const p = JSON.parse(stored);
      if (p.location === "granted") {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
              .then(r => r.json())
              .then(d => {
                const city = d.address?.city || d.address?.town || d.address?.village || null;
                if (city) setLocation(city);
              })
              .catch(() => {});
          },
          () => {},
          { timeout: 5000, maximumAge: 60000 }
        );
      }
    } catch {}
  }, []);

  if (!showOffline && online && !battery && !location) return null;

  return (
    <div className={cn(
      "fixed top-12 left-0 right-0 z-40 flex items-center justify-between px-4 py-1 text-xs transition-all",
      !online ? "bg-red-500/90 text-white" : "bg-card/80 backdrop-blur border-b border-border text-muted-foreground"
    )}>
      <div className="flex items-center gap-2">
        {online
          ? <Wifi className="w-3 h-3 text-emerald-500" />
          : <WifiOff className="w-3 h-3" />}
        <span>{online ? "Online" : "You are offline — showing cached responses"}</span>
      </div>
      <div className="flex items-center gap-3">
        {location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" />
            <span>{location}</span>
          </div>
        )}
        {battery && (
          <div className="flex items-center gap-1">
            {battery.charging
              ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
              : <Battery className={cn("w-3.5 h-3.5", battery.level <= 20 ? "text-red-400" : "text-muted-foreground")} />}
            <span>{battery.level}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
