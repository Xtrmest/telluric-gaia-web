import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Leaf,
  Sparkles,
  Heart,
  Dumbbell,
  Sun,
  Flower2,
  CloudRain,
  Snowflake,
  Star,
} from "lucide-react";
import { api } from "../lib/api";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import { useTemp } from "../context/TempContext";
import { Button } from "../components/ui/button";

const DEPARTMENTS = [
  {
    title: "Women's Collection",
    subtitle: "Bamboo & Hemp Tees, Sweaters, Pants & Shorts",
    to: "/women",
    badge: "Essentials",
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Men's Collection",
    subtitle: "Heavyweight Hemp Tees, Knitwear, Trousers & Underwear",
    to: "/men",
    badge: "Menswear",
    image:
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Underwear & Sexy Lingerie",
    subtitle: "Sheer Bamboo Lace Bodysuits, Strappy Boudoir Sets & Silk Intimates",
    to: "/intimates",
    badge: "Intimates & Lingerie",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Unbranded Activewear",
    subtitle: "Zero-Logo Personalized Workout & Studio Gear",
    to: "/activewear",
    badge: "Workout Lab",
    image:
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=900&q=85",
  },
];

const SEASON_TABS = [
  { id: "Spring", label: "Spring Edit", icon: Flower2 },
  { id: "Summer", label: "Summer Edit", icon: Sun },
  { id: "Autumn", label: "Autumn Edit", icon: CloudRain },
  { id: "Winter", label: "Winter Edit", icon: Snowflake },
];

const REVIEWS = [
  {
    quote:
      "The bamboo silk tees and wide-leg pants feel like liquid cashmere against the skin. Zero loud logos — just pure, quiet luxury.",
    author: "Elena V. · Verified Buyer",
    item: "Women's Essential Bamboo Crew Tee",
  },
  {
    quote:
      "The Gaia Sheer Bamboo Lace Bodysuit and Strappy Lingerie Set rival Parisian luxury houses while being 100% breathable plant fiber.",
    author: "Camille R. · Verified Buyer",
    item: "Gaia Sheer Bamboo Lace Plunge Bodysuit",
  },
  {
    quote:
      "I customized my hemp sweater in the Lotus Chakra studio with 3 botanical ink colors and previewed it on my 3D photo before ordering.",
    author: "Marcus T. · Verified Buyer",
    item: "Men's Heavyweight Hemp & Bamboo Tee",
  },
];

export default function Home() {
  const { accent } = useTemp();
  const [allProducts, setAllProducts] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState("Summer");

  useEffect(() => {
    api.get("/products").then((r) => setAllProducts(r.data));
  }, []);

  const featured = allProducts ? allProducts.filter((p) => p.featured).slice(0, 4) : null;
  const seasonalProducts = allProducts
    ? allProducts.filter((p) => p.season === selectedSeason).slice(0, 4)
    : null;

  return (
    <div data-testid="home-page">
      {/* ==================== LUXURY EDITORIAL HERO ==================== */}
      <section className="relative overflow-hidden border-b border-[#1E2330]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col justify-center md:col-span-7"
            >
              <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">
                // Telluric-Gaia Apparel Labs Inc.
              </span>
              <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tighter sm:text-5xl lg:text-6xl">
                Pure Bamboo &amp; Hemp.
                <br />
                <span style={{ color: accent }}>Elevated for Every Season.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300">
                Architectural basics for Men and Women, sensual bamboo-lace lingerie, and zero-logo activewear — crafted from regenerative hemp and organic bamboo silk. Experience our interactive <strong>3D &amp; Lotus 7-Chakra Try-On Studio</strong>.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  className="bg-[color:var(--thermo)] px-6 py-6 font-mono text-xs font-bold uppercase tracking-mono text-[#07080C] hover:opacity-90"
                  data-testid="hero-women-btn"
                >
                  <Link to="/women">
                    Shop Women <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-[#2A3245] bg-[#0F1117] px-6 py-6 font-mono text-xs uppercase tracking-mono text-slate-100 hover:border-[color:var(--thermo)]"
                  data-testid="hero-men-btn"
                >
                  <Link to="/men">Shop Men</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-rose-500/40 bg-rose-500/10 px-5 py-6 font-mono text-xs uppercase tracking-mono text-rose-200 hover:border-rose-400"
                  data-testid="hero-lingerie-btn"
                >
                  <Link to="/intimates">
                    <Heart className="mr-2 h-3.5 w-3.5 text-rose-400" /> Intimates &amp; Lingerie
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-[#1E2330] pt-6">
                {[
                  ["100%", "Bamboo & Raw Hemp"],
                  ["4 Seasons", "Spring · Summer · Autumn · Winter"],
                  ["Max 3 Inks", "Chakra Customizer Studio"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <div className="font-display text-xl font-extrabold sm:text-2xl" style={{ color: accent }}>
                      {n}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-mono text-slate-500">{l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.12 }}
              className="md:col-span-5"
            >
              <div className="relative overflow-hidden rounded-2xl border border-[#1E2330] bg-[#0F1117]">
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85"
                  alt="Telluric Gaia Luxury Apparel"
                  className="h-[440px] w-full object-cover sm:h-[520px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-transparent to-transparent" />
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-xl border border-[#1E2330] bg-[#07080C]/85 px-4 py-3 backdrop-blur-xl">
                  <div>
                    <span className="block font-mono text-[10px] uppercase tracking-mono text-slate-400">
                      Signature House Edit
                    </span>
                    <span className="font-display text-xs font-bold uppercase text-slate-100">
                      Essentials · Lingerie · Activewear
                    </span>
                  </div>
                  <Link
                    to="/fitting-room"
                    className="flex items-center gap-1.5 rounded-md bg-[color:var(--thermo)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-[#07080C]"
                  >
                    <Sparkles className="h-3 w-3" /> Try On
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== DEDICATED SECTION CARDS ==================== */}
      <section className="border-b border-[#1E2330] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">
                // Curated Houses
              </span>
              <h2 className="mt-1 font-display text-2xl font-extrabold uppercase tracking-tight sm:text-4xl">
                Shop by Dedicated Section
              </h2>
            </div>
            <Link
              to="/catalog"
              className="font-mono text-xs uppercase tracking-mono text-slate-400 hover:text-[color:var(--thermo)]"
            >
              Explore Full Archive →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DEPARTMENTS.map((d, i) => (
              <motion.div
                key={d.to}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={d.to}
                  className="group relative flex h-[380px] flex-col justify-end overflow-hidden rounded-xl border border-[#1E2330] bg-[#0F1117] p-6 transition-all hover:border-[color:var(--thermo)]"
                >
                  <img
                    src={d.image}
                    alt={d.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-[#07080C]/60 to-transparent" />
                  <div className="relative z-10">
                    <span className="inline-block rounded-full bg-[color:var(--thermo)] px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-mono text-[#07080C]">
                      {d.badge}
                    </span>
                    <h3 className="mt-2 font-display text-xl font-extrabold uppercase text-white">
                      {d.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{d.subtitle}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-mono text-[color:var(--thermo)]">
                      Enter Section <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FOUR-SEASON WARDROBE SHOWCASE ==================== */}
      <section className="border-b border-[#1E2330] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">
                // Year-Round Botanical Engineering
              </span>
              <h2 className="mt-1 font-display text-2xl font-extrabold uppercase tracking-tight sm:text-4xl">
                Four-Season Apparel Collection
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {SEASON_TABS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeason(s.id)}
                    data-testid={`home-season-${s.id.toLowerCase()}`}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-mono transition-colors ${
                      selectedSeason === s.id
                        ? "border-transparent bg-[color:var(--thermo)] font-bold text-[#07080C]"
                        : "border-[#1E2330] bg-[#0F1117] text-slate-300 hover:border-[#2A3245]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {seasonalProducts === null
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : seasonalProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* ==================== LOTUS CHAKRA & 3D VIRTUAL TRY-ON BANNER ==================== */}
      <section className="border-b border-[#1E2330] bg-gradient-to-r from-[#0B0E17] via-[#111625] to-[#0B0E17] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-8 rounded-2xl border border-[#2A3245] bg-[#07080C]/90 p-8 lg:grid-cols-12 lg:p-12">
            <div className="lg:col-span-7">
              <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">
                // Interactive Customizer &amp; 3D Photo Try-On
              </span>
              <h2 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
                Lotus Position 7-Chakra Studio &amp; 3-Color Ink Lab
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                Preview every garment on a serene figure in the <strong>Lotus Position</strong> alongside all <strong>7 Chakra Symbols</strong>, or upload your own <strong>3D Picture</strong> to see how each outfit looks on you. Add custom designs with up to <strong>3 pure botanical ink colors</strong> — and watch each chakra illuminate with its corresponding sacred color as it fills.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-[color:var(--thermo)] px-6 py-6 font-mono text-xs font-bold uppercase tracking-mono text-[#07080C]"
                >
                  <Link to="/fitting-room">
                    <Sparkles className="mr-2 h-4 w-4" /> Enter Lotus &amp; 3D Try-On Studio
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-[#2A3245] px-6 py-6 font-mono text-xs uppercase tracking-mono text-slate-200"
                >
                  <Link to="/activewear">
                    <Dumbbell className="mr-2 h-4 w-4" /> Shop Blank Activewear
                  </Link>
                </Button>
              </div>
            </div>

            {/* 7 Chakra Color Spectrum Preview */}
            <div className="flex flex-col items-center justify-center gap-3 lg:col-span-5">
              <div className="flex items-center gap-2.5">
                {[
                  ["#EF4444", "Root"],
                  ["#F97316", "Sacral"],
                  ["#EAB308", "Solar"],
                  ["#10B981", "Heart"],
                  ["#06B6D4", "Throat"],
                  ["#6366F1", "Third Eye"],
                  ["#A855F7", "Crown"],
                ].map(([hex, label]) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <span
                      className="h-9 w-9 rounded-full border border-white/30 shadow-lg"
                      style={{ backgroundColor: hex, boxShadow: `0 0 16px ${hex}70` }}
                    />
                    <span className="font-mono text-[8px] uppercase text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-mono text-slate-400">
                7 Chakras Illuminate as Your Custom Garment Aligns
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SIGNATURE FEATURED PIECES ==================== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">
              // Most Loved Silhouettes
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              Signature Bamboo &amp; Hemp Bestsellers
            </h2>
          </div>
          <Link
            to="/catalog"
            className="group flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-mono text-slate-400 hover:text-[color:var(--thermo)]"
          >
            View all <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured === null
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* ==================== CLIENT SOCIAL PROOF ==================== */}
      <section className="border-t border-[#1E2330] bg-[#0B0E17] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <h2 className="text-center font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            Client Impressions
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {REVIEWS.map((r) => (
              <div
                key={r.author}
                className="flex flex-col justify-between rounded-xl border border-[#1E2330] bg-[#0F1117] p-6"
              >
                <div>
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">&ldquo;{r.quote}&rdquo;</p>
                </div>
                <div className="mt-6 border-t border-[#1E2330] pt-3">
                  <div className="font-mono text-xs font-bold text-slate-200">{r.author}</div>
                  <div className="font-mono text-[10px] uppercase tracking-mono text-[color:var(--thermo)]">
                    {r.item}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
