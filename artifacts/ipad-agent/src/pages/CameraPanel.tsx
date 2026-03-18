import React, { useRef, useState, useEffect } from "react";
import { Camera as CameraIcon, SwitchCamera, Loader2, Scan } from "lucide-react";
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
      if (stream) stream.getTracks().forEach((t) => t.stop());
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      setStream(newStream);
      if (videoRef.current) videoRef.current.srcObject = newStream;
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg").split(",")[1];
      setCapturedImage(base64);
      analyzeMutation.mutate({ data: { imageData: base64, prompt: "Describe this image in detail — objects, scene, text, colours, and anything notable." } });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card">
        <Scan className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Camera & Vision</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFacingMode((f) => (f === "user" ? "environment" : "user"))}
          className="ml-auto h-8 gap-1.5 text-xs"
        >
          <SwitchCamera className="w-3.5 h-3.5" />
          Flip
        </Button>
      </div>

      <div className="flex-1 p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
          {/* Viewfinder */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-video bg-black border border-border rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Corner brackets */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
              </div>
            </div>
            <Button
              size="lg"
              onClick={capture}
              className="h-14 text-base bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <CameraIcon className="w-5 h-5" />
              Capture &amp; Analyze
            </Button>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Analysis */}
          <div className="panel p-5 flex flex-col">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">AI Analysis</p>

            {analyzeMutation.isPending ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Analyzing image…</p>
              </div>
            ) : analyzeMutation.data ? (
              <div className="flex-1 overflow-y-auto space-y-4">
                {capturedImage && (
                  <img
                    src={`data:image/jpeg;base64,${capturedImage}`}
                    alt="Captured"
                    className="w-full max-h-40 object-cover rounded-md border border-border"
                  />
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Model</p>
                  <p className="text-sm text-foreground font-mono">{analyzeMutation.data.model}</p>
                </div>
                {analyzeMutation.data.objects && analyzeMutation.data.objects.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Objects detected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analyzeMutation.data.objects.map((obj, i) => (
                        <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs">
                          {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{analyzeMutation.data.description}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <CameraIcon className="w-10 h-10 opacity-20 mx-auto mb-3" />
                  <p className="text-sm">Capture a photo to analyze it with AI</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
