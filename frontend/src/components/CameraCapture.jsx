import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Video, Upload, X, Check, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";

const MAX = 12;
const FRAME_OPTIONS = [4, 8, 12];

// Captures full-body frames from the phone camera (or file upload) and calls onSave(frames: dataURL[]).
export const CameraCapture = ({ onSave, saving }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [frames, setFrames] = useState([]);
  const [mode, setMode] = useState("spin");
  const [target, setTarget] = useState(8);
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setActive(true);
    } catch (e) {
      setError("Camera unavailable or permission denied. Use photo upload instead.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActive(false);
  };

  const grabFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 960;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  };

  const captureSingle = () => {
    const f = grabFrame();
    if (f) setFrames((prev) => [...prev, f].slice(0, MAX));
  };

  const captureSpin = async () => {
    setCapturing(true);
    const collected = [];
    for (let i = 0; i < target; i++) {
      setCountdown(target - i);
      // allow user to rotate between frames
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 900));
      const f = grabFrame();
      if (f) collected.push(f);
    }
    setCountdown(0);
    setCapturing(false);
    setFrames(collected.slice(0, MAX));
  };

  const onUpload = (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX);
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then((urls) => setFrames((prev) => [...prev, ...urls].slice(0, MAX)));
  };

  const reset = () => setFrames([]);

  const save = () => {
    stopCamera();
    onSave(frames);
  };

  return (
    <div data-testid="camera-capture">
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera stage */}
      {active && (
        <div className="relative overflow-hidden rounded-xl border border-[#1E2330] bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="aspect-[3/4] w-full object-cover" />
          <div className="pointer-events-none absolute inset-6 rounded-lg border border-dashed border-white/25" />
          <AnimatePresence>
            {countdown > 0 && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                key={countdown}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="font-display text-7xl font-extrabold text-white drop-shadow-lg">{countdown}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <span className="rounded-md bg-black/60 px-2 py-1 font-mono text-[9px] uppercase tracking-mono text-white backdrop-blur">
              {mode === "spin" ? `Turn slowly · ${target} shots` : "Strike a pose"}
            </span>
            <button onClick={stopCamera} className="rounded-md bg-black/60 p-1.5 text-white backdrop-blur" data-testid="camera-close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Preview of captured frames */}
      {!active && frames.length > 0 && (
        <div className="rounded-xl border border-[#1E2330] bg-[#0F1117] p-4" data-testid="capture-preview">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-mono text-slate-400">{frames.length} frame(s) captured</span>
            <button onClick={reset} className="font-mono text-[10px] uppercase tracking-mono text-slate-500 hover:text-[color:var(--thermo)]" data-testid="capture-retake">
              <RefreshCw className="mr-1 inline h-3 w-3" /> Retake
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {frames.map((f, i) => (
              <img key={i} src={f} alt="" className="h-28 w-20 shrink-0 rounded-md border border-[#1E2330] object-cover" />
            ))}
          </div>
          <Button
            onClick={save}
            disabled={saving}
            data-testid="save-model-btn"
            className="mt-4 w-full bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C]"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Save Model
          </Button>
        </div>
      )}

      {/* Idle controls */}
      {!active && frames.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#2A3245] bg-[#0F1117] p-6 text-center" data-testid="capture-idle">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full thermo-bg-soft">
            <Camera className="h-5 w-5" style={{ color: "var(--thermo)" }} />
          </div>
          <p className="mt-3 text-sm text-slate-300">Capture your body model</p>
          <p className="mt-1 text-xs text-slate-500">Stand full-body in frame. Record a slow 360° turn so we can spin your try-ons.</p>

          <div className="mt-4 flex items-center justify-center gap-2">
            {[["spin", "360 Spin", Video], ["single", "Single Shot", Camera]].map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                data-testid={`capture-mode-${id}`}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-[10px] uppercase tracking-mono transition-colors ${mode === id ? "border-[color:var(--thermo)] text-[color:var(--thermo)]" : "border-[#1E2330] text-slate-400"}`}
              >
                <Icon className="h-3 w-3" /> {label}
              </button>
            ))}
          </div>

          {mode === "spin" && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-mono text-slate-500">Frames:</span>
              {FRAME_OPTIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => setTarget(o)}
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${target === o ? "border-transparent bg-[color:var(--thermo)] text-[#07080C]" : "border-[#1E2330] text-slate-400"}`}
                >
                  {o}
                </button>
              ))}
            </div>
          )}

          <Button onClick={startCamera} data-testid="open-camera-btn" className="mt-4 w-full bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C]">
            <Camera className="mr-2 h-4 w-4" /> Open Camera
          </Button>

          <div className="my-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#1E2330]" />
            <span className="font-mono text-[9px] uppercase tracking-mono text-slate-600">or</span>
            <div className="h-px flex-1 bg-[#1E2330]" />
          </div>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-[#2A3245] px-4 py-2.5 font-mono text-[11px] uppercase tracking-mono text-slate-300 transition-colors hover:border-[color:var(--thermo)]" data-testid="upload-photos-label">
            <Upload className="h-4 w-4" /> Upload Photo(s)
            <input type="file" accept="image/*" multiple onChange={onUpload} className="hidden" data-testid="upload-photos-input" />
          </label>

          {error && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-amber-400" data-testid="camera-error">
              <AlertTriangle className="h-3.5 w-3.5" /> {error}
            </p>
          )}
        </div>
      )}

      {/* Capture action buttons when camera active */}
      {active && (
        <div className="mt-3 flex gap-3">
          {mode === "single" ? (
            <Button onClick={captureSingle} data-testid="capture-single-btn" className="flex-1 bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C]">
              <Camera className="mr-2 h-4 w-4" /> Capture
            </Button>
          ) : (
            <Button onClick={captureSpin} disabled={capturing} data-testid="capture-spin-btn" className="flex-1 bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C]">
              {capturing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />} {capturing ? "Recording…" : `Record ${target}-shot Spin`}
            </Button>
          )}
          {frames.length > 0 && (
            <Button variant="outline" onClick={() => { stopCamera(); }} className="border-[#2A3245] font-mono text-xs uppercase tracking-mono">
              Done ({frames.length})
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
