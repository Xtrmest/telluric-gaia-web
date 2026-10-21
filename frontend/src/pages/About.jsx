import { motion } from "framer-motion";
import { Leaf, Recycle, Droplets, Wind, ShieldCheck, Factory } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useTemp } from "../context/TempContext";

const LIFECYCLE = [
  { stage: "Cultivation", carbon: -42 },
  { stage: "Processing", carbon: -18 },
  { stage: "Dyeing", carbon: -8 },
  { stage: "Manufacture", carbon: 6 },
  { stage: "Shipping", carbon: 11 },
  { stage: "Use", carbon: 3 },
  { stage: "Compost", carbon: -36 },
];

const METRICS = [
  { icon: Droplets, value: "91%", label: "Less water vs. cotton" },
  { icon: Wind, value: "98.4%", label: "Carbon negative net" },
  { icon: Recycle, value: "100%", label: "Compostable fibers" },
  { icon: ShieldCheck, value: "0", label: "Toxic azo dyes" },
];

export default function About() {
  const { accent } = useTemp();

  return (
    <div data-testid="about-page">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#1E2330]">
        <img
          src="https://images.unsplash.com/photo-1534639077088-d702bcf685e7?crop=entropy&cs=srgb&fm=jpg&q=85"
          alt="Raw bio-textile rolls"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-[#07080C]/70 to-[#07080C]/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-8 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-2xl">
            <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">// Eco Review Report</span>
            <h1 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tighter sm:text-5xl lg:text-6xl">
              Building a sustainable future through clothing
            </h1>
            <p className="mt-6 text-base leading-relaxed text-slate-300">
              Telluric Gaia Apparel Lab exists to prove that high-performance tactical wear can be regenerative.
              Every garment is a closed loop — grown from hemp and bamboo, finished with low-impact dyes,
              and returned to soil at end of life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-b border-[#1E2330]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-[#1E2330] sm:grid-cols-4">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#07080C] p-6 sm:p-8"
            >
              <m.icon className="h-5 w-5" style={{ color: accent }} />
              <div className="mt-4 font-display text-3xl font-extrabold" style={{ color: accent }}>{m.value}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-mono text-slate-500">{m.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Lifecycle chart */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">Lifecycle Analysis</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Net carbon across a garment's full lifecycle, measured in kg CO₂e. Our hemp and bamboo crops
              sequester more carbon during cultivation than the entire manufacture and shipping chain emits — and
              composting closes the loop.
            </p>
            <div className="mt-6 rounded-lg border border-[#1E2330] bg-[#0F1117] p-4">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-emerald-400" />
                <span className="font-mono text-[11px] uppercase tracking-mono text-slate-300">Net: -84 kg CO₂e / garment</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[#1E2330] bg-[#0F1117] p-4 lg:col-span-8">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={LIFECYCLE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accent} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2330" />
                <XAxis dataKey="stage" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#07080C", border: "1px solid #1E2330", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#94A3B8" }}
                />
                <Area type="monotone" dataKey="carbon" stroke={accent} strokeWidth={2} fill="url(#carbonGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Sourcing */}
      <section className="border-t border-[#1E2330]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-12">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">Sourcing Telemetry</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { img: "https://images.unsplash.com/photo-1591625591034-75d303d2e1a4?crop=entropy&cs=srgb&fm=jpg&q=85", title: "Raw Hemp", loc: "Regenerative farms · Oregon", icon: Leaf },
              { img: "https://images.unsplash.com/photo-1715867125247-120c0fc4593b?crop=entropy&cs=srgb&fm=jpg&q=85", title: "Bamboo Rayon", loc: "FSC-certified · Yunnan", icon: Recycle },
              { img: "https://images.unsplash.com/photo-1534639077088-d702bcf685e7?crop=entropy&cs=srgb&fm=jpg&q=85", title: "Closed-loop Mill", loc: "Solar-powered · Reykjavik", icon: Factory },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="overflow-hidden rounded-lg border border-[#1E2330] bg-[#0F1117]"
              >
                <img src={s.img} alt={s.title} className="h-44 w-full object-cover" />
                <div className="p-5">
                  <s.icon className="h-5 w-5" style={{ color: accent }} />
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-mono text-slate-500">{s.loc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chemistry safety sheet */}
      <section className="border-t border-[#1E2330]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-12">
          <div className="rounded-xl border border-[#1E2330] bg-[#0F1117] p-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" style={{ color: accent }} />
              <h2 className="font-display text-xl font-bold uppercase tracking-tight">Material Safety Sheet</h2>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                ["Low-Impact Dyes", "Fiber-reactive, skin-safe, REACH compliant"],
                ["Water Use", "91% less than conventional cotton"],
                ["Heavy Metals", "None · zero cadmium, lead, or mercury"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-[#1E2330] bg-[#07080C] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-mono text-slate-500">{k}</div>
                  <div className="mt-2 text-sm text-slate-300">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
