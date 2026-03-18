import React, { useRef, useState, useEffect } from "react";
import { Camera as CameraIcon, Scan, RefreshCcw, Loader2 } from "lucide-react";
import { useAnalyzeImage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export function CameraPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const analyzeMutation = useAnalyzeImage();

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
        setCapturedImage(base64);
        
        // Auto trigger analysis
        analyzeMutation.mutate({
          data: { imageData: base64, prompt: "Identify objects and analyze the scene." }
        });
      }
    }
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-background p-4 sm:p-6 overflow-y-auto">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 text-primary">
          <Scan className="w-8 h-8" />
          <h1 className="text-2xl font-mono uppercase text-glow">Optic Sensor</h1>
        </div>
        <Button variant="outline" size="sm" onClick={flipCamera}>
          <RefreshCcw className="w-4 h-4 mr-2" /> FLIP
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Viewfinder */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-video bg-black border-2 border-primary/30 rounded-2xl overflow-hidden terminal-glow">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            {/* Overlay grid */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,65,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute inset-0 pointer-events-none border-[20px] border-black/50" />
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary" />
          </div>
          
          <Button size="lg" variant="terminal" onClick={capture} className="w-full h-16 text-xl">
            <CameraIcon className="w-6 h-6 mr-3" /> CAPTURE_FRAME
          </Button>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Analysis Result */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col">
          <h3 className="font-mono text-lg text-primary mb-4 border-b border-primary/20 pb-2">SCAN_ANALYSIS</h3>
          
          {analyzeMutation.isPending ? (
            <div className="flex-1 flex flex-col items-center justify-center text-primary/70 gap-4">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-mono animate-pulse">Processing image matrix...</p>
            </div>
          ) : analyzeMutation.data ? (
            <div className="flex-1 overflow-y-auto space-y-4">
              {capturedImage && (
                <img 
                  src={`data:image/jpeg;base64,${capturedImage}`} 
                  alt="Captured" 
                  className="w-32 h-32 object-cover rounded-lg border border-primary/50 mb-4"
                />
              )}
              <div className="font-mono text-sm">
                <span className="text-muted-foreground block mb-1">MODEL:</span>
                <span className="text-primary">{analyzeMutation.data.model}</span>
              </div>
              <div className="font-mono text-sm">
                <span className="text-muted-foreground block mb-1">CONFIDENCE:</span>
                <span className="text-primary">{analyzeMutation.data.confidence}%</span>
              </div>
              <div className="font-mono text-sm">
                <span className="text-muted-foreground block mb-2">OBJECTS_DETECTED:</span>
                <div className="flex flex-wrap gap-2">
                  {analyzeMutation.data.objects?.map((obj, i) => (
                    <span key={i} className="px-2 py-1 bg-secondary border border-primary/30 rounded text-xs text-primary">
                      {obj}
                    </span>
                  ))}
                </div>
              </div>
              <div className="font-mono text-sm">
                <span className="text-muted-foreground block mb-1">DESCRIPTION:</span>
                <p className="text-foreground leading-relaxed">
                  {analyzeMutation.data.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono opacity-50 text-center">
              AWAITING_CAPTURE<br/>NO_DATA_IN_BUFFER
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
