import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, Package } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";

export default function OrderConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);

  useEffect(() => {
    if (!order) {
      api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => {});
    }
  }, [id, order]);

  if (!order) {
    return <div className="mx-auto max-w-2xl px-4 py-32 text-center text-slate-400">Loading order…</div>;
  }

  const copyHash = () => {
    navigator.clipboard.writeText(order.tracking_hash);
    toast.success("Tracking hash copied");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8" data-testid="order-confirmation-page">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-[#1E2330] bg-[#0F1117] p-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring" }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--thermo-soft)" }}>
          <CheckCircle2 className="h-8 w-8" style={{ color: "var(--thermo)" }} />
        </motion.div>
        <h1 className="mt-5 font-display text-2xl font-extrabold uppercase tracking-tight">Order Confirmed</h1>
        <p className="mt-2 text-sm text-slate-400">Your bio-synthetic kit is entering the grid. A receipt has been logged.</p>

        <button onClick={copyHash} data-testid="tracking-hash" className="mx-auto mt-6 flex items-center gap-2 rounded-md border border-[#2A3245] bg-[#07080C] px-4 py-2.5 font-mono text-sm">
          <span className="text-slate-400">Tracking:</span>
          <span style={{ color: "var(--thermo)" }}>{order.tracking_hash}</span>
          <Copy className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </motion.div>

      <div className="mt-6 rounded-xl border border-[#1E2330] bg-[#0F1117] p-6">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-mono text-slate-400">
          <Package className="h-4 w-4" /> Items
        </h2>
        <div className="mt-4 space-y-3">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {i.image && <img src={i.image} alt={i.name} className="h-14 w-11 rounded object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{i.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-mono text-slate-500">{i.size} · {i.color} · ×{i.quantity}</p>
              </div>
              <span className="font-mono text-sm tabular-nums">${(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[#1E2330] pt-4">
          <span className="font-mono text-xs uppercase tracking-mono">Total Paid</span>
          <span className="font-mono text-lg font-bold tabular-nums">${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline" className="flex-1 border-[#2A3245] font-mono text-xs uppercase tracking-mono"><Link to="/catalog">Continue Shopping</Link></Button>
        <Button asChild className="flex-1 bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C]"><Link to="/account">View Orders</Link></Button>
      </div>
    </div>
  );
}
