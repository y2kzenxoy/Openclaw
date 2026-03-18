import { useState, useEffect, useCallback } from "react";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unavailable" | "unknown";

export interface PermissionState {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
  clipboard: PermissionStatus;
  storage: PermissionStatus;
  wakeLock: PermissionStatus;
  motion: PermissionStatus;
  bluetooth: PermissionStatus;
  speech: PermissionStatus;
  contacts: PermissionStatus;
  screenCapture: PermissionStatus;
  battery: PermissionStatus;
  backgroundSync: PermissionStatus;
  biometrics: PermissionStatus;
}

const STORAGE_KEY = "oc_permissions";
const ONBOARDING_KEY = "oc_onboarding_done";

const defaultState: PermissionState = {
  camera: "unknown",
  microphone: "unknown",
  location: "unknown",
  notifications: "unknown",
  clipboard: "unknown",
  storage: "unknown",
  wakeLock: "unknown",
  motion: "unknown",
  bluetooth: "unknown",
  speech: "unknown",
  contacts: "unknown",
  screenCapture: "unknown",
  battery: "unknown",
  backgroundSync: "unknown",
  biometrics: "unknown",
};

function loadFromStorage(): PermissionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultState };
}

function saveToStorage(state: PermissionState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// Detect browser API availability
function supports(api: string): boolean {
  switch (api) {
    case "camera": return !!(navigator.mediaDevices?.getUserMedia);
    case "microphone": return !!(navigator.mediaDevices?.getUserMedia);
    case "location": return !!navigator.geolocation;
    case "notifications": return typeof Notification !== "undefined";
    case "clipboard": return !!(navigator.clipboard);
    case "storage": return !!(navigator.storage?.persist);
    case "wakeLock": return !!("wakeLock" in navigator);
    case "motion": return typeof DeviceMotionEvent !== "undefined";
    case "bluetooth": return !!(navigator as any).bluetooth;
    case "speech": return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
    case "contacts": return !!(navigator as any).contacts;
    case "screenCapture": return !!(navigator.mediaDevices?.getDisplayMedia);
    case "battery": return !!(navigator as any).getBattery;
    case "backgroundSync": return "serviceWorker" in navigator && "sync" in (window as any).ServiceWorkerRegistration?.prototype;
    case "biometrics": return !!(window.PublicKeyCredential);
    default: return false;
  }
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionState>(loadFromStorage);
  const [onboardingDone, setOnboardingDone] = useState(() => !!localStorage.getItem(ONBOARDING_KEY));

  const update = useCallback((key: keyof PermissionState, value: PermissionStatus) => {
    setPermissions((prev) => {
      const next = { ...prev, [key]: value };
      saveToStorage(next);
      return next;
    });
  }, []);

  // On mount: check static API availability
  useEffect(() => {
    const keys = Object.keys(defaultState) as (keyof PermissionState)[];
    setPermissions((prev) => {
      const next = { ...prev };
      for (const key of keys) {
        if (!supports(key)) next[key] = "unavailable";
        else if (next[key] === "unknown") next[key] = "prompt";
      }
      saveToStorage(next);
      return next;
    });
  }, []);

  // Check permissions-API queryable ones
  useEffect(() => {
    const queryable = ["camera", "microphone", "notifications", "geolocation"] as const;
    for (const name of queryable) {
      const mapped: Partial<Record<string, keyof PermissionState>> = {
        camera: "camera",
        microphone: "microphone",
        notifications: "notifications",
        geolocation: "location",
      };
      navigator.permissions?.query({ name: name as PermissionName }).then((result) => {
        const key = mapped[name];
        if (key) {
          update(key, result.state as PermissionStatus);
          result.onchange = () => update(key, result.state as PermissionStatus);
        }
      }).catch(() => {});
    }
  }, [update]);

  // ── Individual permission request functions ──

  const requestCamera = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("camera")) return "unavailable";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      update("camera", "granted");
      return "granted";
    } catch {
      update("camera", "denied");
      return "denied";
    }
  }, [update]);

  const requestMicrophone = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("microphone")) return "unavailable";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      update("microphone", "granted");
      return "granted";
    } catch {
      update("microphone", "denied");
      return "denied";
    }
  }, [update]);

  const requestLocation = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("location")) return "unavailable";
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => { update("location", "granted"); resolve("granted"); },
        () => { update("location", "denied");  resolve("denied"); },
        { timeout: 10000 }
      );
    });
  }, [update]);

  const requestNotifications = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("notifications")) return "unavailable";
    const result = await Notification.requestPermission();
    const status = result === "granted" ? "granted" : "denied";
    update("notifications", status);
    return status;
  }, [update]);

  const requestClipboard = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("clipboard")) return "unavailable";
    try {
      await navigator.clipboard.readText();
      update("clipboard", "granted");
      return "granted";
    } catch {
      // Clipboard might still be writable
      update("clipboard", "prompt");
      return "prompt";
    }
  }, [update]);

  const requestStorage = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("storage")) return "unavailable";
    try {
      const granted = await navigator.storage.persist();
      const status: PermissionStatus = granted ? "granted" : "denied";
      update("storage", status);
      return status;
    } catch {
      update("storage", "denied");
      return "denied";
    }
  }, [update]);

  const requestWakeLock = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("wakeLock")) return "unavailable";
    try {
      const lock = await (navigator as any).wakeLock.request("screen");
      lock.release();
      update("wakeLock", "granted");
      return "granted";
    } catch {
      update("wakeLock", "denied");
      return "denied";
    }
  }, [update]);

  const requestMotion = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("motion")) return "unavailable";
    try {
      // iOS 13+ requires explicit permission
      const DeviceMotion = DeviceMotionEvent as any;
      if (typeof DeviceMotion.requestPermission === "function") {
        const result = await DeviceMotion.requestPermission();
        const status: PermissionStatus = result === "granted" ? "granted" : "denied";
        update("motion", status);
        return status;
      } else {
        update("motion", "granted");
        return "granted";
      }
    } catch {
      update("motion", "denied");
      return "denied";
    }
  }, [update]);

  const requestBluetooth = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("bluetooth")) return "unavailable";
    try {
      await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
      update("bluetooth", "granted");
      return "granted";
    } catch {
      update("bluetooth", "denied");
      return "denied";
    }
  }, [update]);

  const requestSpeech = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("speech")) return "unavailable";
    // Trigger mic permission which is needed for speech
    return requestMicrophone();
  }, [requestMicrophone]);

  const requestContacts = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("contacts")) return "unavailable";
    try {
      await (navigator as any).contacts.select(["name"], { multiple: false });
      update("contacts", "granted");
      return "granted";
    } catch {
      update("contacts", "denied");
      return "denied";
    }
  }, [update]);

  const requestScreenCapture = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("screenCapture")) return "unavailable";
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      update("screenCapture", "granted");
      return "granted";
    } catch {
      update("screenCapture", "denied");
      return "denied";
    }
  }, [update]);

  const requestBattery = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("battery")) return "unavailable";
    try {
      await (navigator as any).getBattery();
      update("battery", "granted");
      return "granted";
    } catch {
      update("battery", "denied");
      return "denied";
    }
  }, [update]);

  const requestBackgroundSync = useCallback(async (): Promise<PermissionStatus> => {
    update("backgroundSync", "unavailable");
    return "unavailable";
  }, [update]);

  const requestBiometrics = useCallback(async (): Promise<PermissionStatus> => {
    if (!supports("biometrics")) return "unavailable";
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      const status: PermissionStatus = available ? "granted" : "unavailable";
      update("biometrics", status);
      return status;
    } catch {
      update("biometrics", "unavailable");
      return "unavailable";
    }
  }, [update]);

  const requestAll = useCallback(async () => {
    await Promise.allSettled([
      requestCamera(),
      requestMicrophone(),
      requestLocation(),
      requestNotifications(),
      requestClipboard(),
      requestStorage(),
      requestWakeLock(),
      requestMotion(),
      requestSpeech(),
      requestBattery(),
      requestBiometrics(),
    ]);
  }, [
    requestCamera, requestMicrophone, requestLocation, requestNotifications,
    requestClipboard, requestStorage, requestWakeLock, requestMotion,
    requestSpeech, requestBattery, requestBiometrics,
  ]);

  const markOnboardingDone = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setOnboardingDone(true);
  }, []);

  const requestByKey = useCallback(async (key: keyof PermissionState): Promise<PermissionStatus> => {
    const map: Record<keyof PermissionState, () => Promise<PermissionStatus>> = {
      camera: requestCamera,
      microphone: requestMicrophone,
      location: requestLocation,
      notifications: requestNotifications,
      clipboard: requestClipboard,
      storage: requestStorage,
      wakeLock: requestWakeLock,
      motion: requestMotion,
      bluetooth: requestBluetooth,
      speech: requestSpeech,
      contacts: requestContacts,
      screenCapture: requestScreenCapture,
      battery: requestBattery,
      backgroundSync: requestBackgroundSync,
      biometrics: requestBiometrics,
    };
    return map[key]();
  }, [
    requestCamera, requestMicrophone, requestLocation, requestNotifications,
    requestClipboard, requestStorage, requestWakeLock, requestMotion,
    requestBluetooth, requestSpeech, requestContacts, requestScreenCapture,
    requestBattery, requestBackgroundSync, requestBiometrics,
  ]);

  return {
    permissions,
    onboardingDone,
    markOnboardingDone,
    requestAll,
    requestByKey,
    requestCamera,
    requestMicrophone,
    requestLocation,
    requestNotifications,
    requestClipboard,
    requestStorage,
    requestWakeLock,
    requestMotion,
    requestBluetooth,
    requestSpeech,
    requestContacts,
    requestScreenCapture,
    requestBattery,
    requestBiometrics,
  };
}
