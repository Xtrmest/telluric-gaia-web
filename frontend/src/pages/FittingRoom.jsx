import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Loader2, Shirt, User, Trash2, Wand2, Plus, Check } from "lucide-react";
import { api, mediaUrl, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CameraCapture } from "../components/CameraCapture";
import { SpinViewer } from "../components/SpinViewer";
import { Button } from "../components/ui/button";

export default function FittingRoom() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [tab, setTab] = useState("create");

  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [showCapture, setShowCapture] = useState(false);
  const [savingModel, setSavingModel] = useState(false);

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(params.get("product") || null);

  const [job, setJob] = useState(null);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef(null);

  const [gallery, setGallery] = useState([]);

  const loadModels = useCallback(async () => {
    const { data } = await api.get("/tryon/models");
    setModels(data);
    if (data.length && !selectedModelId) setSelectedModelId(data[0].id);
    if (!data.length) setShowCapture(true);
  }, [selectedModelId]);

  const loadGallery = useCallback(async () => {
    const { data } = await api.get("/tryon/gallery");
    setGallery(data);
  }, []);

  useEffect(() => {
    loadModels();
    loadGallery();
    api.get("/products").then((r) => setProducts(r.data));
    return () => pollRef.current && clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveModel = async (frames) => {
    if (!frames.length) return;
    setSavingModel(true);
    try {
      const { data } = await api.post("/tryon/models", { frames });
      toast.success("Body model saved");
      setShowCapture(false);
      setSelectedModelId(data.id);
      await loadModels();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed to save model");
    } finally {
      setSavingModel(false);
    }
  };

  const pollJob = useCallback((jobId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/tryon/jobs/${jobId}`);
        setJob(data);
        if (data.status === "complete" || data.status === "failed") {
          clearInterval(pollRef.current);
          setGenerating(false);
          if (data.status === "complete") {
            toast.success("Try-on ready & saved to your gallery");
            loadGallery();
          } else {
            toast.error("Try-on generation failed. Please try again.");
          }
        }
      } catch {
        clearInterval(pollRef.current);
        setGenerating(false);
      }
    }, 600);
  }, [loadGallery]);

  const generate = async () => {
    if (!selectedModelId || !selectedProductId) return;
    setGenerating(true);
    setJob({ status: "processing", done: 0, total: models.find((m) => m.id === selectedModelId)?.frame_count || 1, frames: [] });
    try {
      const { data } = await api.post("/tryon/generate", { model_id: selectedModelId, product_id: selectedProductId });
      setJob((j) => ({ ...j, id: data.job_id, total: data.total }));
      pollJob(data.job_id);
    } catch (err) {
      setGenerating(false);
      setJob(null);
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not start try-on");
    }
  };

  const deleteGalleryItem = async (id) => {
    try {
      await api.delete(`/tryon/gallery/${id}`);
      setGallery((g) => g.filter((x) => x.id !== id));
      toast.success("Removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const progressPct = job ? Math.round((job.done / Math.max(job.total, 1)) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-12" data-testid="fitting-room-page">
      <div className="flex flex-col gap-2 border-b border-[#1E2330] pb-8">
        <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">// AI Virtual Fitting Room</span>
        <h1 className="flex items-center gap-3 font-display text-4xl font-extrabold uppercase tracking-tighter sm:text-5xl">
          Fitting Room <Sparkles className="h-7 w-7" style={{ color: "var(--thermo)" }} />
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Record a slow 360° turn, then let the lab's AI dress your model in any garment. Spin it, swap outfits onto the
          same turn, and save looks to your gallery.
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        {[["create", "Create Look", Wand2], ["gallery", `Gallery (${gallery.length})`, Shirt]].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            data-testid={`fitting-tab-${id}`}
            className={`flex items-center gap-2 rounded-md border px-4 py-2 font-mono text-[11px] uppercase tracking-mono transition-colors ${tab === id ? "border-[color:var(--thermo)] text-[color:var(--thermo)]" : "border-[#1E2330] text-slate-400"}`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "create" && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: model + garment */}
          <div className="space-y-8 lg:col-span-7">
            {/* Model */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-mono text-slate-400">
                <User className="h-4 w-4" /> 1 · Your Body Model
              </h2>

              {models.length > 0 && !showCapture && (
                <div className="flex flex-wrap gap-3">
                  {models.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModelId(m.id)}
                      data-testid={`model-card-${m.id}`}
                      className={`relative h-32 w-24 overflow-hidden rounded-lg border transition-colors ${selectedModelId === m.id ? "border-[color:var(--thermo)]" : "border-[#1E2330] hover:border-[#2A3245]"}`}
                    >
                      <img src={mediaUrl(m.frames[0]?.url)} alt="model" className="h-full w-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-[#07080C]/80 py-0.5 text-center font-mono text-[9px] uppercase tracking-mono text-slate-300">{m.frame_count} shots</span>
                      {selectedModelId === m.id && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--thermo)]"><Check className="h-2.5 w-2.5 text-[#07080C]" /></span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCapture(true)}
                    data-testid="new-model-btn"
                    className="flex h-32 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#2A3245] text-slate-500 transition-colors hover:border-[color:var(--thermo)] hover:text-[color:var(--thermo)]"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-mono text-[9px] uppercase tracking-mono">New</span>
                  </button>
                </div>
              )}

              {showCapture && (
                <div className="space-y-3">
                  <CameraCapture onSave={saveModel} saving={savingModel} />
                  {models.length > 0 && (
                    <button onClick={() => setShowCapture(false)} className="font-mono text-[10px] uppercase tracking-mono text-slate-500 hover:text-[color:var(--thermo)]">
                      ← Back to saved models
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Garment */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-mono text-slate-400">
                <Shirt className="h-4 w-4" /> 2 · Choose a Garment
              </h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    data-testid={`garment-${p.id}`}
                    className={`group overflow-hidden rounded-lg border text-left transition-colors ${selectedProductId === p.id ? "border-[color:var(--thermo)]" : "border-[#1E2330] hover:border-[#2A3245]"}`}
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#07080C]">
                      <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover" />
                      {selectedProductId === p.id && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--thermo)]"><Check className="h-3 w-3 text-[#07080C]" /></span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-[11px] font-medium text-slate-200">{p.name}</p>
                      <p className="font-mono text-[9px] uppercase tracking-mono text-slate-500">${p.price.toFixed(0)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <Button
              onClick={generate}
              disabled={!selectedModelId || !selectedProductId || generating}
              data-testid="generate-tryon-btn"
              className="w-full bg-[color:var(--thermo)] py-6 font-mono text-xs font-bold uppercase tracking-mono text-[#07080C] hover:opacity-90"
            >
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {generating ? "Generating your look…" : "Generate Try-On"}
            </Button>
          </div>

          {/* Right: result */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <h2 className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-mono text-slate-400">
                <Sparkles className="h-4 w-4" /> 3 · Your Look
              </h2>

              <AnimatePresence mode="wait">
                {job && job.status === "processing" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-4 rounded-xl border border-[#1E2330] bg-[#0F1117]"
                    data-testid="tryon-loading"
                  >
                    <div className="relative">
                      <Loader2 className="h-10 w-10 animate-spin" style={{ color: "var(--thermo)" }} />
                    </div>
                    <div className="w-2/3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#1E2330]">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: "var(--thermo)" }} />
                      </div>
                      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-mono text-slate-400">
                        Dressing frame {job.done}/{job.total}
                      </p>
                    </div>
                    <p className="max-w-[220px] text-center text-xs text-slate-500">The AI is tailoring each angle of your turn. This can take a minute.</p>
                  </motion.div>
                )}

                {job && job.status === "complete" && job.frames?.length > 0 && (
                  <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} data-testid="tryon-result">
                    <SpinViewer images={job.frames.map((f) => mediaUrl(f.url))} testid="result-spin-viewer" />
                    <div className="mt-3 flex items-center justify-between rounded-md border border-[#1E2330] bg-[#0F1117] px-3 py-2">
                      <span className="font-mono text-[10px] uppercase tracking-mono text-emerald-400">✓ Saved to gallery</span>
                      <button onClick={() => { setJob(null); }} className="font-mono text-[10px] uppercase tracking-mono text-slate-400 hover:text-[color:var(--thermo)]" data-testid="try-another-btn">
                        Try another garment →
                      </button>
                    </div>
                  </motion.div>
                )}

                {!job && (
                  <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#2A3245] bg-[#0F1117] text-center" data-testid="tryon-placeholder">
                    <Sparkles className="h-8 w-8 text-slate-700" />
                    <p className="max-w-[220px] text-sm text-slate-500">
                      {selectedModel && selectedProduct ? "Ready — hit Generate Try-On." : "Pick a model and a garment to begin."}
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {tab === "gallery" && (
        <div className="mt-8">
          {gallery.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#1E2330] py-20 text-center" data-testid="gallery-empty">
              <Shirt className="mx-auto h-9 w-9 text-slate-600" />
              <p className="mt-4 text-sm text-slate-400">No saved looks yet.</p>
              <Button onClick={() => setTab("create")} className="mt-4 bg-[color:var(--thermo)] font-mono text-xs uppercase tracking-mono text-[#07080C]">Create a Look</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((g) => (
                <div key={g.id} className="rounded-xl border border-[#1E2330] bg-[#0F1117] p-4" data-testid={`gallery-item-${g.id}`}>
                  <SpinViewer images={g.frames.map((f) => mediaUrl(f.url))} testid={`gallery-spin-${g.id}`} />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">{g.product_name}</p>
                      <p className="font-mono text-[9px] uppercase tracking-mono text-slate-500">{new Date(g.created_at).toLocaleDateString()} · {g.frames.length} frames</p>
                    </div>
                    <button onClick={() => deleteGalleryItem(g.id)} data-testid={`gallery-delete-${g.id}`} className="text-slate-500 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
