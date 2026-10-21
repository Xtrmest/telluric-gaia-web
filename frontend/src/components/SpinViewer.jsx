import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCw, Play, Pause, Move } from "lucide-react";

// Drag-to-rotate / auto-spin turntable viewer. `images` = array of absolute src strings.
export const SpinViewer = ({ images = [], className = "", testid = "spin-viewer" }) => {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(images.length > 1);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startIdx = useRef(0);
  const containerRef = useRef(null);
  const n = images.length;

  useEffect(() => {
    if (!playing || n <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), 140);
    return () => clearInterval(t);
  }, [playing, n]);

  const onDown = useCallback((clientX) => {
    if (n <= 1) return;
    dragging.current = true;
    startX.current = clientX;
    startIdx.current = idx;
    setPlaying(false);
  }, [idx, n]);

  const onMove = useCallback((clientX) => {
    if (!dragging.current || n <= 1) return;
    const width = containerRef.current?.offsetWidth || 300;
    const delta = clientX - startX.current;
    const step = Math.round((delta / width) * n * 1.4);
    let next = (startIdx.current - step) % n;
    if (next < 0) next += n;
    setIdx(next);
  }, [n]);

  const onUp = () => { dragging.current = false; };

  if (n === 0) return null;

  return (
    <div className={className} data-testid={testid}>
      <div
        ref={containerRef}
        className="relative aspect-[3/4] w-full cursor-ew-resize touch-none overflow-hidden rounded-xl border border-[#1E2330] bg-[#07080C] select-none"
        onMouseDown={(e) => onDown(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={(e) => onDown(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onUp}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`frame ${i}`}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: i === idx ? 1 : 0, transition: "opacity 60ms linear" }}
          />
        ))}

        {n > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
            <span className="flex items-center gap-1.5 rounded-md bg-[#07080C]/70 px-2 py-1 font-mono text-[9px] uppercase tracking-mono text-slate-300 backdrop-blur">
              <Move className="h-3 w-3" /> drag to rotate
            </span>
            <span className="rounded-md bg-[#07080C]/70 px-2 py-1 font-mono text-[9px] tabular-nums text-slate-300 backdrop-blur">
              {idx + 1}/{n}
            </span>
          </div>
        )}
      </div>

      {n > 1 && (
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            data-testid="spin-play-toggle"
            className="flex items-center gap-1.5 rounded-md border border-[#2A3245] px-3 py-1.5 font-mono text-[10px] uppercase tracking-mono text-slate-300 transition-colors hover:border-[color:var(--thermo)]"
          >
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />} {playing ? "Pause" : "Spin"}
          </button>
          <div className="relative flex-1">
            <input
              type="range"
              min={0}
              max={n - 1}
              value={idx}
              onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)); }}
              className="w-full accent-[color:var(--thermo)]"
              aria-label="Rotate"
            />
          </div>
          <RotateCw className="h-3.5 w-3.5 text-slate-500" />
        </div>
      )}
    </div>
  );
};
