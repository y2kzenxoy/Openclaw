import { useState, useEffect, useRef, useCallback } from "react";

const SpeechRecognitionCtor =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useSpeechRecognition(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => !!SpeechRecognitionCtor);
  const recRef = useRef<any>(null);

  const start = useCallback(() => {
    if (!supported || listening) return;
    const rec = new SpeechRecognitionCtor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      if (text.trim()) onResult(text.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.start();
    recRef.current = rec;
    setListening(true);
  }, [supported, listening, onResult]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => () => { recRef.current?.abort(); }, []);

  return { supported, listening, start, stop };
}

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof speechSynthesis !== "undefined";

  const speak = useCallback((text: string, lang = "en-US") => {
    if (!supported || !text.trim()) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.slice(0, 1000));
    utter.lang = lang;
    utter.rate = 1.0;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    speechSynthesis.speak(utter);
  }, [supported]);

  const cancel = useCallback(() => {
    speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { supported, speaking, speak, cancel };
}
