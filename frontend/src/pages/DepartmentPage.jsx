import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Sun, CloudRain, Snowflake, Flower2 } from "lucide-react";
import { api } from "../lib/api";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import { Button } from "../components/ui/button";

const SEASONS = [
  { id: "all", label: "All Seasons", icon: Sparkles },
  { id: "Spring", label: "Spring", icon: Flower2 },
  { id: "Summer", label: "Summer", icon: Sun },
  { id: "Autumn", label: "Autumn", icon: CloudRain },
  { id: "Winter", label: "Winter", icon: Snowflake },
];

export default function DepartmentPage({
  title,
  subtitle,
  eyebrow,
  heroImage,
  defaultGender = "all",
  defaultCategory = "all",
  defaultSeason = "all",
  tabs = [],
}) {
  const [products, setProducts] = useState(null);
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "all");
  const [season, setSeason] = useState(defaultSeason);

  useEffect(() => {
    setActiveTab(tabs[0]?.id || "all");
    setSeason(defaultSeason);
  }, [title, defaultSeason, tabs]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setProducts(null);
    const params = {};
    if (defaultGender !== "all") params.gender = defaultGender;
    if (defaultCategory !== "all") params.category = defaultCategory;
    if (season !== "all") params.season = season;

    const currentTabObj = tabs.find((t) => t.id === activeTab);
    if (currentTabObj?.filter) {
      Object.assign(params, currentTabObj.filter);
    }

    api.get("/products", { params }).then((r) => setProducts(r.data));
  }, [defaultGender, defaultCategory, season, activeTab, tabs]);

  return (
    <div data-testid="department-page">
      {/* Editorial Hero Banner */}
      <section className="relative overflow-hidden border-b border-[#1E2330] bg-[#0B0E17]">
        {heroImage && (
          <img
            src={heroImage}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080C] via-[#07080C]/85 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">
              {eyebrow}
            </span>
            <h1 className="mt-3 font-display text-4xl font-extrabold uppercase tracking-tighter text-slate-100 sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              {subtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C] hover:opacity-90"
              >
                <Link to="/fitting-room">
                  <Sparkles className="mr-2 h-4 w-4" /> Try On in 3D &amp; Chakra Studio
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[#2A3245] bg-[#07080C]/60 font-mono text-xs uppercase tracking-mono text-slate-200 hover:border-[color:var(--thermo)]"
              >
                <Link to="/checkout">
                  Direct Checkout <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Subcategory & Season Filter Bar */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-5 border-b border-[#1E2330] pb-6 lg:flex-row lg:items-center lg:justify-between">
          {tabs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  data-testid={`dept-tab-${t.id}`}
                  className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-mono transition-all ${
                    activeTab === t.id
                      ? "border-transparent bg-[color:var(--thermo)] font-bold text-[#07080C]"
                      : "border-[#1E2330] bg-[#0F1117] text-slate-300 hover:border-[#2A3245]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Season Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-mono text-slate-500">
              Season:
            </span>
            {SEASONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSeason(s.id)}
                  data-testid={`season-chip-${s.id}`}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-mono transition-colors ${
                    season === s.id
                      ? "border-[color:var(--thermo)] bg-[#0F1117] text-[color:var(--thermo)]"
                      : "border-[#1E2330] text-slate-400 hover:border-[#2A3245]"
                  }`}
                >
                  <Icon className="h-3 w-3" /> {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products === null
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>

        {products && products.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-[#1E2330] py-16 text-center">
            <p className="text-sm text-slate-400">No items match this combination of section &amp; season filters.</p>
            <Button
              variant="ghost"
              onClick={() => {
                setActiveTab(tabs[0]?.id || "all");
                setSeason("all");
              }}
              className="mt-3 text-[color:var(--thermo)]"
            >
              Reset section filters
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
