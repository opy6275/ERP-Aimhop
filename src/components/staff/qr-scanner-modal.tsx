"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { X, Camera, CheckCircle2, AlertCircle, RefreshCw, Upload, ShieldCheck, Sparkles } from "@/components/ui/icons";

type SuccessData = {
  checkinTime: string;
  message: string;
  alreadyMarked?: boolean;
  staff: {
    fullName: string;
    staffCode: string;
    department: string;
  };
};

export function QrScannerModal({
  isOpen,
  onClose,
  onCheckinSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCheckinSuccess: (data: SuccessData) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<SuccessData | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleQrPayload = useCallback(
    async (rawCode: string) => {
      setProcessing(true);
      setServerError(null);

      // Audio & Haptic feedback
      try {
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([80, 40, 80]);
        }
      } catch {
        // Ignore audio/vibrate error
      }

      try {
        const res = await fetch("/api/v1/me/attendance/qr-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scannedData: rawCode }),
        });

        const data = await res.json();
        if (!res.ok) {
          setServerError(data.message || data.error || "Invalid or expired QR code.");
          setProcessing(false);
          // Resume scanning after 2.5s error pause
          setTimeout(() => {
            setServerError(null);
          }, 3000);
          return;
        }

        // Success! Stop camera
        stopCamera();
        const successPayload: SuccessData = {
          checkinTime: data.checkinTime || data.data?.checkinTime || new Date().toLocaleTimeString("en-IN"),
          message: data.message || data.data?.message || "Attendance verified successfully!",
          staff: data.staff || data.data?.staff || {
            fullName: "Staff Member",
            staffCode: "",
            department: "",
          },
        };

        setScanResult(successPayload);
        onCheckinSuccess(successPayload);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error";
        setServerError(msg);
        setProcessing(false);
      }
    },
    [stopCamera, onCheckinSuccess]
  );

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || processing || scanResult) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        handleQrPayload(code.data);
        return;
      }
    }

    animFrameId.current = requestAnimationFrame(scanFrame);
  }, [processing, scanResult, handleQrPayload]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setServerError(null);
    setProcessing(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraError("Camera access is not supported by your browser or requires HTTPS.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setHasCamera(true);
        setScanning(true);
        animFrameId.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: unknown) {
      setHasCamera(false);
      const msg = err instanceof Error ? err.message : "Unable to access camera";
      setCameraError(
        msg.includes("Permission denied") || msg.includes("NotAllowedError")
          ? "Camera permission denied. Please allow camera access in browser settings to scan QR."
          : `Camera error: ${msg}`
      );
    }
  }, [scanFrame]);

  // Handle image upload fallback
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleQrPayload(code.data);
          } else {
            setServerError("Could not detect a valid QR code in this image. Please try again.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Office QR Check-In</h3>
              <p className="text-xs text-slate-400">AimHop Attendance Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {scanResult ? (
            /* SUCCESS TRIGGER STATE */
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-300">
              <div
                className={`relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-lg animate-bounce ${
                  scanResult.alreadyMarked
                    ? "bg-blue-500/20 text-blue-400 border-blue-500 shadow-blue-500/20"
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-emerald-500/20"
                }`}
              >
                <CheckCircle2 size={44} className="stroke-[2.5]" />
                <span
                  className={`absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-950 font-bold text-xs ${
                    scanResult.alreadyMarked ? "bg-blue-400" : "bg-emerald-500"
                  }`}
                >
                  <Sparkles size={12} />
                </span>
              </div>

              <div className="space-y-1.5">
                <div
                  className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    scanResult.alreadyMarked
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {scanResult.alreadyMarked ? "Already Marked Today" : "Attendance Recorded"}
                </div>
                <h4 className="text-xl font-extrabold text-white">
                  {scanResult.alreadyMarked ? "Attendance Pehle Se Recorded Hai" : "Check-In Successful!"}
                </h4>
                <p className={`text-sm font-semibold ${scanResult.alreadyMarked ? "text-blue-300" : "text-emerald-400"}`}>
                  {scanResult.message}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-slate-300 mt-2">
                  <ShieldCheck size={14} className={scanResult.alreadyMarked ? "text-blue-400" : "text-emerald-400"} />
                  {scanResult.alreadyMarked ? "Initial Punch-In at:" : "Verified at:"}{" "}
                  <span className={`font-bold ${scanResult.alreadyMarked ? "text-blue-300" : "text-emerald-300"}`}>
                    {scanResult.checkinTime}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Staff Member:</span>
                  <span className="font-bold text-white">{scanResult.staff.fullName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Staff Code:</span>
                  <span className="font-mono font-semibold text-blue-400">{scanResult.staff.staffCode}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status:</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Present (Verified)
                  </span>
                </div>
              </div>

              {/* SUCCESS TRIGGER BUTTON */}
              <button
                type="button"
                onClick={onClose}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
                  scanResult.alreadyMarked
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500"
                }`}
              >
                <CheckCircle2 size={18} />
                <span>Attendance Verified — Done</span>
              </button>
            </div>
          ) : (
            /* ACTIVE CAMERA SCANNER VIEW */
            <div className="space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-slate-800 bg-black shadow-inner flex items-center justify-center">
                {/* Hidden canvas used for video frame processing */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Viewfinder Target Graphic */}
                {scanning && !processing && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-56 w-56">
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 h-8 w-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 h-8 w-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />

                      {/* Moving laser scan line */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#3b82f6] animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Processing Overlay */}
                {processing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm gap-3">
                    <RefreshCw size={32} className="animate-spin text-blue-400" />
                    <p className="text-sm font-bold text-white">Verifying Office QR Code...</p>
                  </div>
                )}

                {/* Camera error state */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 gap-3">
                    <AlertCircle size={36} className="text-rose-400" />
                    <p className="text-xs text-rose-300 font-medium">{cameraError}</p>
                    <label className="cursor-pointer mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 border border-slate-700">
                      <Upload size={14} />
                      <span>Upload QR Photo Instead</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Server or Scan error toast */}
              {serverError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 text-rose-400" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Instructions & File upload alternative */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-400">
                  Align the official Office QR code within the frame to verify attendance.
                </p>
                <label className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  <Upload size={13} />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
