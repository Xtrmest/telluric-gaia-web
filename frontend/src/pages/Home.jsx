import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, Recycle, Wind } from "lucide-react";
import { api } from "../lib/api";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import { useTemp } from "../context/TempContext";
import { Button } from "../components/ui/button";

const MATERIALS = [
  { name: "Raw Hemp", desc: "Antimicrobial · UV-resistant · regenerative crop", icon: Leaf },
  { name: "Bamboo Micro-Knit", desc: "Silk-soft · thermoregulating · compostable", icon: Recycle },
  { name: "Recycled Bio-Polymer", desc: "Ocean-bound plastics · weatherproof · durable", icon: Wind },
];

export default function Home() {
  const { accent } = useTemp();
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    api.get("/products", { params: { featured: true } }).then((r) => setFeatured(r.data.slice(0, 4)));
  }, []);

  const hero = "https://images.unsplash.com/photo-1761428961720-38db3883826b?crop=entropy&cs=srgb&fm=jpg&q=85";

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#1E2330]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col justify-center md:col-span-7"
            >
              <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">
                // Bio-Synthetic Tactical Wear
              </span>
              <h1 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tighter sm:text-5xl lg:text-6xl">
                Engineered
                <br />
                by <span style={{ color: accent }}>nature</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400">
                Regenerative hemp and bamboo textiles, recycled bio-polymers and low-impact dyes —
                high-performance tactical wear built for a sustainable future.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild className="bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C] hover:opacity-90" data-testid="hero-catalog-btn">
                  <Link to="/catalog">Explore Catalog <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="border-[#2A3245] bg-transparent font-mono text-xs uppercase tracking-mono hover:bg-[#171A23]" data-testid="hero-eco-btn">
                  <Link to="/about">Read Eco Review</Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 border-t border-[#1E2330] pt-6">
                {[["98.4%", "Carbon Negative"], ["100%", "Compostable"], ["0", "Toxic Dyes"]].map(([n, l]) => (
                  <div key={l}>
                    <div className="font-display text-2xl font-extrabold" style={{ color: accent }}>{n}</div>
                    <div className="font-mono text-[10px] uppercase tracking-mono text-slate-500">{l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="md:col-span-5"
            >
              <div className="relative overflow-hidden rounded-xl border border-[#1E2330] bg-[#0F1117]">
                <img src={hero} alt="Apparel model" className="h-[420px] w-full object-cover sm:h-[520px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-transparent to-transparent" />
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-lg border border-[#1E2330] bg-[#07080C]/80 px-4 py-3 backdrop-blur-xl">
                  <span className="font-mono text-[10px] uppercase tracking-mono text-slate-400">New Collection · Vol. 01</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold" style={{ color: accent }}>
                    <Leaf className="h-3 w-3" /> Carbon Negative
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MATERIALS */}
      <section className="border-b border-[#1E2330]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-12">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">The Material Stack</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {MATERIALS.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border border-[#1E2330] bg-[#0F1117] p-6 transition-colors hover:border-[#2A3245]"
              >
                <m.icon className="h-6 w-6" style={{ color: accent }} />
                <h3 className="mt-4 text-lg font-semibold">{m.name}</h3>
                <p className="mt-2 text-sm text-slate-400">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">New Collection</h2>
          <Link to="/catalog" className="group flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-mono text-slate-400 hover:text-[color:var(--thermo)]">
            View all <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured === null
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>
    </div>
  );
}
