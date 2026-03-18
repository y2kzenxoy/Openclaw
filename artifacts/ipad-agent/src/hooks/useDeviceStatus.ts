import { useState, useEffect } from "react";

export interface DeviceStatus {
  online: boolean;
  batteryLevel: number | null;
  batteryCharging: boolean | null;
  locationCoords: { lat: number; lng: number; city?: string } | null;
}

export function useDeviceStatus() {
  const [status, setStatus] = useState<DeviceStatus>({
    online: navigator.onLine,
    batteryLevel: null,
    batteryCharging: null,
    locationCoords: null,
  });

  // Network
  useEffect(() => {
    const onOnline = () => setStatus((s) => ({ ...s, online: true }));
    const onOffline = () => setStatus((s) => ({ ...s, online: false }));
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Battery
  useEffect(() => {
    if (!(navigator as any).getBattery) return;
    (navigator as any).getBattery().then((battery: any) => {
      const update = () => setStatus((s) => ({
        ...s,
        batteryLevel: Math.round(battery.level * 100),
        batteryCharging: battery.charging,
      }));
      update();
      battery.addEventListener("levelchange", update);
      battery.addEventListener("chargingchange", update);
    }).catch(() => {});
  }, []);

  return { status, setStatus };
}

export function useWakeLock() {
  const [active, setActive] = useState(false);
  const [lock, setLock] = useState<any>(null);

  const acquire = async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      const wl = await (navigator as any).wakeLock.request("screen");
      wl.addEventListener("release", () => setActive(false));
      setLock(wl);
      setActive(true);
    } catch {}
  };

  const release = () => {
    lock?.release();
    setLock(null);
    setActive(false);
  };

  // Re-acquire on visibility change
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === "visible" && lock === null && active) {
        acquire();
      }
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, [lock, active]);

  return { active, acquire, release };
}
