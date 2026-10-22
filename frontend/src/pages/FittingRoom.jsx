import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  Upload,
  Palette,
  ShoppingBag,
  Rotate3D,
  Check,
  RefreshCw,
  Layers,
  Eye,
} from "lucide-react";
import { api } from "../lib/api";
import { CHAKRAS, INK_COLORS } from "../data/mockData";
import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";

const DESIGN_MOTIFS = [
  { id: "none", name: "Pure Blank (No Design)", desc: "Unbranded architectural silhouette" },
  { id: "lotus", name: "Sacred Lotus Geometry", desc: "Symmetrical 3-layer lotus bloom" },
  { id: "telluric", name: "Telluric Earth Waves", desc: "Harmonic terrestrial frequency lines" },
  { id: "gaia", name: "Gaia Botanical Crest", desc: "Organic hemp & bamboo leaf sigil" },
  { id: "chakra-align", name: "Seven-Chakra Axis", desc: "Vertical kundalini alignment motif" },
];

const GARMENT_TINTS = {
  "Obsidian Black": "#141720",
  "Raw Ecru": "#E5E0D5",
  "Sage Moss": "#4A5D4E",
  "Terracotta Rose": "#9E584D",
  "Deep Indigo": "#232B42",
};

export default function FittingRoom() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [genderFilter, setGenderFilter] = useState("all");

  // Custom design state (strictly max 3 ink colors)
  const [selectedMotif, setSelectedMotif] = useState("lotus");
  const [selectedInks, setSelectedInks] = useState([
    INK_COLORS[3], // Gaia Emerald
    INK_COLORS[4], // Ether Cyan
    INK_COLORS[6], // Crown Violet
  ]);
  const [customText, setCustomText] = useState("");

  // Chakra fill level (1 to 7) + manual toggle support
  const [activeChakras, setActiveChakras] = useState([
    "root",
    "sacral",
    "solar",
    "heart",
    "throat",
  ]);

  // 3D Picture upload & interactive 3D rotation
  const [uploaded3DPhoto, setUploaded3DPhoto] = useState(null);
  const [viewMode, setViewMode] = useState("lotus"); // "lotus" | "3d-photo"
  const [tiltAngle, setTiltAngle] = useState(0);
  const [garmentScale, setGarmentScale] = useState(100);
  const [garmentOffsetY, setGarmentOffsetY] = useState(0);

  useEffect(() => {
    api.get("/products").then((r) => {
      setProducts(r.data);
      const paramId = params.get("product");
      const found = r.data.find((p) => p.id === paramId) || r.data[0];
      if (found) setSelectedProduct(found);
    });
  }, [params]);

  // Automatically synchronize chakra fill progression as user customizes
  useEffect(() => {
    const filled = new Set(["root"]);
    if (selectedProduct) filled.add("sacral");
    if (selectedInks.length >= 1) filled.add("solar");
    if (selectedInks.length >= 2) filled.add("heart");
    if (selectedInks.length >= 3) filled.add("throat");
    if (selectedMotif !== "none") filled.add("thirdeye");
    if (uploaded3DPhoto || customText.trim()) filled.add("crown");

    // Also light up any chakra directly matching a chosen ink color
    selectedInks.forEach((ink) => {
      if (ink.chakraId) filled.add(ink.chakraId);
    });

    setActiveChakras(Array.from(filled));
  }, [selectedProduct, selectedInks, selectedMotif, uploaded3DPhoto, customText]);

  const toggleInkColor = (ink) => {
    const exists = selectedInks.some((i) => i.hex === ink.hex);
    if (exists) {
      setSelectedInks((prev) => prev.filter((i) => i.hex !== ink.hex));
      return;
    }
    if (selectedInks.length >= 3) {
      toast.error("Maximum 3 ink colors allowed! Deselect a color first to swap.");
      return;
    }
    setSelectedInks((prev) => [...prev, ink]);
  };

  const toggleChakra = (chakraId) => {
    setActiveChakras((prev) =>
      prev.includes(chakraId) ? prev.filter((id) => id !== chakraId) : [...prev, chakraId]
    );
  };

  const fillAllChakras = () => {
    setActiveChakras(CHAKRAS.map((c) => c.id));
    toast.success("All 7 Chakras energized and illuminated");
  };

  const handle3DUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploaded3DPhoto(reader.result);
      setViewMode("3d-photo");
      toast.success("3D picture uploaded — switch garments or rotate perspective below!");
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const inkLabel =
      selectedMotif === "none"
        ? selectedProduct.color_palette
        : `${selectedProduct.color_palette} + ${selectedMotif} (${selectedInks
            .map((i) => i.name)
            .join(", ")})`;
    addItem(selectedProduct, selectedSize, inkLabel, 1);
    toast.success(`${selectedProduct.name} added to your cart`);
  };

  const filteredProducts =
    genderFilter === "all"
      ? products
      : products.filter((p) => p.gender === genderFilter);

  const garmentHex =
    GARMENT_TINTS[selectedProduct?.color_palette] || "#161B26";
  const ink1 = selectedInks[0]?.hex || "#00F2FE";
  const ink2 = selectedInks[1]?.hex || ink1;
  const ink3 = selectedInks[2]?.hex || ink2;

  // Ordered chakras from Root (1) to Crown (7) for fill calculation
  const filledCount = activeChakras.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-12" data-testid="fitting-room-page">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[#1E2330] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">
            // Lotus Chakra &amp; 3D Virtual Try-On Studio
          </span>
          <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-extrabold uppercase tracking-tighter sm:text-5xl">
            Sacred Try-On &amp; 3-Ink Customizer
            <Sparkles className="h-7 w-7 text-[color:var(--thermo)]" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Visualize every Bamboo &amp; Hemp garment on our meditative Lotus figure flanked by the 7 Chakras, or upload your own 3D picture to preview outfit changes. Customize garments with up to <strong>3 botanical ink colors</strong> — watch each chakra illuminate in its sacred color as your alignment fills.
          </p>
        </div>

        {/* View switcher */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode("lotus")}
            data-testid="view-mode-lotus"
            className={`flex items-center gap-2 rounded-md border px-4 py-2.5 font-mono text-xs uppercase tracking-mono transition-colors ${
              viewMode === "lotus"
                ? "border-[color:var(--thermo)] bg-[color:var(--thermo)] font-bold text-[#07080C]"
                : "border-[#1E2330] bg-[#0F1117] text-slate-300"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Lotus &amp; Chakras View
          </button>
          <button
            onClick={() => setViewMode("3d-photo")}
            data-testid="view-mode-3d"
            className={`flex items-center gap-2 rounded-md border px-4 py-2.5 font-mono text-xs uppercase tracking-mono transition-colors ${
              viewMode === "3d-photo"
                ? "border-[color:var(--thermo)] bg-[color:var(--thermo)] font-bold text-[#07080C]"
                : "border-[#1E2330] bg-[#0F1117] text-slate-300"
            }`}
          >
            <Rotate3D className="h-3.5 w-3.5" /> 3D Picture Try-On
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* ==================== LEFT/CENTER: LOTUS CHAKRA & 3D TRY-ON STAGE ==================== */}
        <div className="lg:col-span-7">
          <div className="sticky top-24 overflow-hidden rounded-2xl border border-[#1E2330] bg-[#0B0E17] p-6">
            {/* Top Status Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2330] pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-mono text-slate-400">
                  Trying On:{" "}
                </span>
                <span className="font-display text-sm font-bold uppercase text-slate-100">
                  {selectedProduct?.name || "Select a Garment"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-mono text-[color:var(--thermo)]">
                  Chakras Lit: {filledCount}/7
                </span>
                <button
                  onClick={fillAllChakras}
                  data-testid="energize-all-chakras-btn"
                  className="rounded border border-[#2A3245] bg-[#141926] px-2.5 py-1 font-mono text-[9px] uppercase tracking-mono text-slate-200 hover:border-[color:var(--thermo)]"
                >
                  Illuminate All 7
                </button>
              </div>
            </div>

            {/* STAGE CONTENT */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* Main Visual Stage (Lotus Position OR 3D Uploaded Picture) */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#1E2330] bg-[#07080C] p-4 md:col-span-7">
                {viewMode === "lotus" ? (
                  <div className="relative flex w-full flex-col items-center">
                    {/* Simple Meditative Person in Lotus Position SVG with Live Garment & Chakra Nodes */}
                    <svg
                      viewBox="0 0 360 440"
                      className="h-[380px] w-full max-w-[340px]"
                      data-testid="lotus-position-svg"
                    >
                      <defs>
                        <radialGradient id="auraGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={ink1} stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#07080C" stopOpacity="0" />
                        </radialGradient>
                      </defs>

                      {/* Subtle Sacred Geometry Aura */}
                      <circle cx="180" cy="220" r="165" fill="url(#auraGlow)" />
                      <circle
                        cx="180"
                        cy="220"
                        r="148"
                        fill="none"
                        stroke="#1E2330"
                        strokeDasharray="4 4"
                      />

                      {/* Meditative Lotus Figure Silhouette (Clean Minimalist Line Art) */}
                      {/* Head & Neck */}
                      <circle
                        cx="180"
                        cy="86"
                        r="26"
                        fill="#0F131D"
                        stroke="#94A3B8"
                        strokeWidth="2"
                      />
                      <rect x="172" y="112" width="16" height="14" rx="4" fill="#0F131D" stroke="#94A3B8" strokeWidth="1.5" />

                      {/* Crossed Legs in Lotus Position (Padmasana) */}
                      <path
                        d="M92 330 C92 296, 140 286, 180 286 C220 286, 268 296, 268 330 C268 355, 225 362, 180 362 C135 362, 92 355, 92 330 Z"
                        fill={
                          selectedProduct?.category === "Pants & Shorts" ||
                          selectedProduct?.category === "Activewear & Workout"
                            ? garmentHex
                            : "#111622"
                        }
                        stroke="#CBD5E1"
                        strokeWidth="2"
                      />
                      {/* Crossed Ankles / Feet detail */}
                      <path
                        d="M115 336 Q180 310 245 336"
                        fill="none"
                        stroke="#64748B"
                        strokeWidth="2"
                      />
                      <path
                        d="M125 348 Q180 324 235 348"
                        fill="none"
                        stroke="#64748B"
                        strokeWidth="1.8"
                      />

                      {/* Arms resting on knees in Gyan Mudra */}
                      <path
                        d="M132 136 L96 248 L112 315"
                        fill="none"
                        stroke="#94A3B8"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M228 136 L264 248 L248 315"
                        fill="none"
                        stroke="#94A3B8"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Garment Torso Silhouette on the Lotus Figure */}
                      {selectedProduct?.subcategory === "Sexy Lingerie" ||
                      selectedProduct?.subcategory === "Underwear & Bras" ? (
                        // Sculpted Lingerie / Intimate Bodysuit / Bra Silhouette
                        <g>
                          <path
                            d="M145 128 L162 172 L180 154 L198 172 L215 128 L224 245 L180 284 L136 245 Z"
                            fill={garmentHex}
                            stroke={ink1}
                            strokeWidth="2"
                          />
                          <path
                            d="M150 130 L180 185 L210 130"
                            fill="none"
                            stroke="#F43F5E"
                            strokeWidth="1.5"
                            strokeDasharray="3 2"
                          />
                        </g>
                      ) : (
                        // Essential Tee / Sweater / Activewear Top Silhouette
                        <path
                          d="M126 126 L156 122 Q180 134 204 122 L234 126 L254 184 L232 194 L222 158 L222 284 L138 284 L138 158 L128 194 L106 184 Z"
                          fill={garmentHex}
                          stroke="#E2E8F0"
                          strokeWidth="2"
                        />
                      )}

                      {/* Custom 3-Color Graphic Design Rendered on the Garment Chest */}
                      {selectedMotif !== "none" && (
                        <g transform="translate(180, 198)">
                          {selectedMotif === "lotus" && (
                            <g>
                              <circle cx="0" cy="0" r="26" fill="none" stroke={ink1} strokeWidth="1.8" />
                              <path
                                d="M0 -22 C10 -10, 10 8, 0 20 C-10 8, -10 -10, 0 -22 Z"
                                fill={ink1}
                                fillOpacity="0.35"
                                stroke={ink1}
                                strokeWidth="1.5"
                              />
                              <path
                                d="M-20 -6 C-8 -12, 4 -2, 18 10 C2 14, -12 8, -20 -6 Z"
                                fill={ink2}
                                fillOpacity="0.4"
                                stroke={ink2}
                                strokeWidth="1.5"
                              />
                              <path
                                d="M20 -6 C8 -12, -4 -2, -18 10 C-2 14, 12 8, 20 -6 Z"
                                fill={ink3}
                                fillOpacity="0.4"
                                stroke={ink3}
                                strokeWidth="1.5"
                              />
                            </g>
                          )}
                          {selectedMotif === "telluric" && (
                            <g>
                              <path d="M-28 -12 Q-14 -22 0 -12 T28 -12" fill="none" stroke={ink1} strokeWidth="2.5" />
                              <path d="M-28 0 Q-14 -10 0 0 T28 0" fill="none" stroke={ink2} strokeWidth="2.5" />
                              <path d="M-28 12 Q-14 2 0 12 T28 12" fill="none" stroke={ink3} strokeWidth="2.5" />
                            </g>
                          )}
                          {selectedMotif === "gaia" && (
                            <g>
                              <polygon points="0,-24 22,16 -22,16" fill="none" stroke={ink1} strokeWidth="2" />
                              <polygon points="0,24 22,-14 -22,-14" fill="none" stroke={ink2} strokeWidth="2" />
                              <circle cx="0" cy="0" r="8" fill={ink3} />
                            </g>
                          )}
                          {selectedMotif === "chakra-align" && (
                            <g>
                              <line x1="0" y1="-26" x2="0" y2="26" stroke={ink1} strokeWidth="2" />
                              <circle cx="0" cy="-16" r="5" fill={ink1} />
                              <circle cx="0" cy="0" r="6" fill={ink2} />
                              <circle cx="0" cy="16" r="5" fill={ink3} />
                            </g>
                          )}
                        </g>
                      )}

                      {customText && (
                        <text
                          x="180"
                          y="246"
                          textAnchor="middle"
                          fill={ink1}
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {customText.slice(0, 18).toUpperCase()}
                        </text>
                      )}

                      {/* 7 Spine Chakra Alignment Dots on the Lotus Person */}
                      {CHAKRAS.map((c) => {
                        const isLit = activeChakras.includes(c.id);
                        const cy = 48 + ((100 - c.yPercent) / 100) * 310;
                        // Map crown(12)->68, root(82)->315
                        const mappedY = 40 + (c.yPercent / 100) * 320;
                        return (
                          <g key={c.id} onClick={() => toggleChakra(c.id)} className="cursor-pointer">
                            {isLit && (
                              <circle
                                cx="180"
                                cy={mappedY}
                                r="11"
                                fill={c.color}
                                fillOpacity="0.28"
                              />
                            )}
                            <circle
                              cx="180"
                              cy={mappedY}
                              r="5.5"
                              fill={isLit ? c.color : "#1E2330"}
                              stroke={isLit ? "#FFFFFF" : "#475569"}
                              strokeWidth="1.2"
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Selected Garment Thumbnail Card Overlay */}
                    {selectedProduct && (
                      <div className="mt-2 flex w-full items-center gap-3 rounded-lg border border-[#1E2330] bg-[#0F1117] p-2.5">
                        <img
                          src={selectedProduct.images?.[0]}
                          alt={selectedProduct.name}
                          className="h-14 w-12 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-100">
                            {selectedProduct.name}
                          </p>
                          <p className="font-mono text-[10px] uppercase tracking-mono text-slate-400">
                            {selectedProduct.material} · {selectedProduct.season}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-bold text-[color:var(--thermo)]">
                          ${selectedProduct.price.toFixed(0)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ==================== 3D PICTURE UPLOAD & LIVE OUTFIT OVERLAY VIEW ==================== */
                  <div className="flex w-full flex-col items-center" data-testid="3d-tryon-stage">
                    <div
                      className="relative flex aspect-[3/4] w-full max-w-[320px] items-center justify-center overflow-hidden rounded-xl border border-[#2A3245] bg-[#0B0E17]"
                      style={{ perspective: "900px" }}
                    >
                      <div
                        className="relative h-full w-full transition-transform duration-200"
                        style={{
                          transform: `rotateY(${tiltAngle}deg)`,
                          transformStyle: "preserve-3d",
                        }}
                      >
                        {uploaded3DPhoto ? (
                          <img
                            src={uploaded3DPhoto}
                            alt="Uploaded 3D Model"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                            <Rotate3D className="h-10 w-10 text-[color:var(--thermo)]" />
                            <p className="mt-3 text-sm font-medium text-slate-200">
                              Upload Your 3D Picture / Full-Body Photo
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              See yourself changing between different Bamboo &amp; Hemp outfits in interactive 3D perspective.
                            </p>
                          </div>
                        )}

                        {/* Garment + 3-Color Ink Overlay on 3D Photo */}
                        {selectedProduct && (
                          <div
                            className="pointer-events-none absolute inset-x-0 top-1/4 flex flex-col items-center justify-center"
                            style={{
                              transform: `translateY(${garmentOffsetY}px) scale(${garmentScale / 100})`,
                            }}
                          >
                            <div className="relative h-48 w-40 overflow-hidden rounded-xl border-2 border-[color:var(--thermo)]/60 shadow-2xl">
                              <img
                                src={selectedProduct.images?.[0]}
                                alt={selectedProduct.name}
                                className="h-full w-full object-cover opacity-90"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-[#07080C]/85 px-2 py-1 text-center font-mono text-[9px] uppercase text-[color:var(--thermo)]">
                                {selectedProduct.name}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3D Controls & Upload Button */}
                    <div className="mt-4 w-full space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="w-24 font-mono text-[10px] uppercase tracking-mono text-slate-400">
                          3D Rotate ({tiltAngle}°)
                        </span>
                        <input
                          type="range"
                          min="-35"
                          max="35"
                          value={tiltAngle}
                          onChange={(e) => setTiltAngle(Number(e.target.value))}
                          className="flex-1 accent-[color:var(--thermo)]"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-24 font-mono text-[10px] uppercase tracking-mono text-slate-400">
                          Fit Scale ({garmentScale}%)
                        </span>
                        <input
                          type="range"
                          min="70"
                          max="130"
                          value={garmentScale}
                          onChange={(e) => setGarmentScale(Number(e.target.value))}
                          className="flex-1 accent-[color:var(--thermo)]"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-24 font-mono text-[10px] uppercase tracking-mono text-slate-400">
                          Position Y
                        </span>
                        <input
                          type="range"
                          min="-60"
                          max="60"
                          value={garmentOffsetY}
                          onChange={(e) => setGarmentOffsetY(Number(e.target.value))}
                          className="flex-1 accent-[color:var(--thermo)]"
                        />
                      </div>

                      <label
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[color:var(--thermo)] bg-[#0F1117] px-4 py-3 font-mono text-xs font-bold uppercase tracking-mono text-[color:var(--thermo)] transition-colors hover:bg-[var(--thermo-soft)]"
                        data-testid="upload-3d-photo-label"
                      >
                        <Upload className="h-4 w-4" />
                        {uploaded3DPhoto ? "Change 3D Picture" : "Upload 3D Picture / Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handle3DUpload}
                          className="hidden"
                          data-testid="upload-3d-photo-input"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* ==================== BESIDE THE CLOTHES: THE 7 CHAKRA SYMBOLS COLUMN ==================== */}
              <div className="flex flex-col justify-between rounded-xl border border-[#1E2330] bg-[#07080C] p-4 md:col-span-5" data-testid="chakra-symbols-panel">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-mono text-slate-400">
                    // 7 Sacred Chakra Symbols
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Click any chakra or customize your garment — each chakra fills with its corresponding color as it activates.
                  </p>
                </div>

                <div className="my-3 space-y-2.5">
                  {CHAKRAS.map((chakra) => {
                    const isFilled = activeChakras.includes(chakra.id);
                    return (
                      <motion.button
                        key={chakra.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => toggleChakra(chakra.id)}
                        data-testid={`chakra-symbol-${chakra.id}`}
                        className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all"
                        style={{
                          borderColor: isFilled ? chakra.color : "#1E2330",
                          backgroundColor: isFilled ? `${chakra.color}18` : "#0B0E17",
                        }}
                      >
                        {/* Sacred Geometric Chakra Lotus Symbol SVG */}
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all"
                          style={{
                            borderColor: isFilled ? chakra.color : "#2A3245",
                            backgroundColor: isFilled ? chakra.color : "transparent",
                            boxShadow: isFilled ? `0 0 14px ${chakra.color}80` : "none",
                          }}
                        >
                          <svg viewBox="0 0 36 36" className="h-6 w-6">
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke={isFilled ? "#07080C" : "#64748B"}
                              strokeWidth="1.5"
                            />
                            <polygon
                              points="18,6 28,24 8,24"
                              fill="none"
                              stroke={isFilled ? "#07080C" : "#64748B"}
                              strokeWidth="1.5"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="4"
                              fill={isFilled ? "#07080C" : "#64748B"}
                            />
                          </svg>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span
                              className="font-display text-xs font-bold uppercase"
                              style={{ color: isFilled ? chakra.color : "#94A3B8" }}
                            >
                              {chakra.number}. {chakra.name}
                            </span>
                            <span className="font-mono text-[9px] uppercase text-slate-500">
                              {isFilled ? "FILLED" : "DORMANT"}
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">
                            {chakra.sanskrit} · {chakra.element}
                          </div>
                          {/* Chakra Fill Bar */}
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#151924]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: isFilled ? "100%" : "12%",
                                backgroundColor: isFilled ? chakra.color : "#334155",
                              }}
                            />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="rounded-lg border border-[#1E2330] bg-[#0B0E17] p-2.5 text-center font-mono text-[10px] uppercase tracking-mono text-slate-400">
                  Energy Alignment: {Math.round((filledCount / 7) * 100)}% Complete
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: GARMENT SELECTOR + MAX 3-COLOR INK STUDIO ==================== */}
        <div className="space-y-6 lg:col-span-5">
          {/* 1. Choose Clothing to Try On */}
          <section className="rounded-xl border border-[#1E2330] bg-[#0F1117] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-mono text-xs font-bold uppercase tracking-mono text-slate-200">
                1 · Select Clothing to Try On
              </h2>
              <div className="flex gap-1">
                {["all", "Women", "Men"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-mono ${
                      genderFilter === g
                        ? "bg-[color:var(--thermo)] font-bold text-[#07080C]"
                        : "bg-[#07080C] text-slate-400"
                    }`}
                  >
                    {g === "all" ? "All" : g}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid max-h-64 grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3">
              {filteredProducts.map((p) => {
                const active = selectedProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    data-testid={`garment-${p.id}`}
                    className={`group overflow-hidden rounded-lg border text-left transition-all ${
                      active
                        ? "border-[color:var(--thermo)] bg-[#141926]"
                        : "border-[#1E2330] bg-[#07080C] hover:border-[#2A3245]"
                    }`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover" />
                      {active && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--thermo)]">
                          <Check className="h-3 w-3 text-[#07080C]" />
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-[11px] font-medium text-slate-200">{p.name}</p>
                      <p className="font-mono text-[9px] uppercase text-slate-500">
                        {p.gender} · ${p.price.toFixed(0)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Choose Custom Design Motif */}
          <section className="rounded-xl border border-[#1E2330] bg-[#0F1117] p-5">
            <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-mono text-slate-200">
              <Layers className="h-4 w-4 text-[color:var(--thermo)]" /> 2 · Add Custom Clothing Design
            </h2>
            <div className="mt-3 space-y-2">
              {DESIGN_MOTIFS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMotif(m.id)}
                  data-testid={`motif-${m.id}`}
                  className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                    selectedMotif === m.id
                      ? "border-[color:var(--thermo)] bg-[#141926]"
                      : "border-[#1E2330] bg-[#07080C] hover:border-[#2A3245]"
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{m.name}</div>
                    <div className="font-mono text-[10px] text-slate-500">{m.desc}</div>
                  </div>
                  {selectedMotif === m.id && (
                    <Check className="h-4 w-4 text-[color:var(--thermo)]" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="font-mono text-[10px] uppercase tracking-mono text-slate-400">
                Optional Custom Mantra / Text (Max 18 chars)
              </label>
              <input
                type="text"
                maxLength={18}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g. GAIA HARMONY"
                data-testid="custom-text-input"
                className="mt-1 w-full rounded-md border border-[#1E2330] bg-[#07080C] px-3 py-2 font-mono text-xs uppercase text-slate-200 outline-none focus:border-[color:var(--thermo)]"
              />
            </div>
          </section>

          {/* 3. Botanical Ink Palette (Strictly Max 3 Colors) */}
          <section className="rounded-xl border border-[#1E2330] bg-[#0F1117] p-5" data-testid="ink-palette-section">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-mono text-slate-200">
                <Palette className="h-4 w-4 text-[color:var(--thermo)]" /> 3 · Botanical Ink Colors
              </h2>
              <span
                className="rounded-full bg-[color:var(--thermo)]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[color:var(--thermo)]"
                data-testid="ink-count-badge"
              >
                {selectedInks.length} / 3 Colors Max
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Our organic screen-printing press uses a strict maximum of <strong>3 botanical ink colors</strong> per garment. Each chosen ink illuminates its corresponding chakra.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {INK_COLORS.map((ink) => {
                const isSelected = selectedInks.some((i) => i.hex === ink.hex);
                return (
                  <button
                    key={ink.name}
                    onClick={() => toggleInkColor(ink)}
                    data-testid={`ink-color-${ink.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${
                      isSelected
                        ? "border-white bg-[#171C28]"
                        : "border-[#1E2330] bg-[#07080C] opacity-75 hover:opacity-100"
                    }`}
                  >
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border border-white/30"
                      style={{ backgroundColor: ink.hex }}
                    />
                    <span className="truncate font-mono text-[10px] text-slate-200">
                      {ink.name.split(" ")[1] || ink.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. Size & Add to Cart / Checkout */}
          <section className="rounded-xl border border-[#1E2330] bg-[#0F1117] p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-mono text-slate-400">
                Select Size
              </span>
              <div className="flex gap-1.5">
                {(selectedProduct?.sizes || ["XS", "S", "M", "L", "XL"]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`h-8 w-9 rounded border font-mono text-xs font-bold ${
                      selectedSize === s
                        ? "border-[color:var(--thermo)] text-[color:var(--thermo)]"
                        : "border-[#1E2330] text-slate-400"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleAddToCart}
                data-testid="tryon-add-to-cart-btn"
                className="flex-1 bg-[color:var(--thermo)] py-6 font-mono text-xs font-bold uppercase tracking-mono text-[#07080C] hover:opacity-90"
              >
                <ShoppingBag className="mr-2 h-4 w-4" /> Add Custom Look to Cart
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleAddToCart();
                  navigate("/checkout");
                }}
                data-testid="tryon-checkout-now-btn"
                className="border-[#2A3245] py-6 font-mono text-xs uppercase tracking-mono text-slate-200 hover:border-[color:var(--thermo)]"
              >
                Checkout Now
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
