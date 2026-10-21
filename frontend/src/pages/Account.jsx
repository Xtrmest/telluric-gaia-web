import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, User } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

export default function Account() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get("/orders").then((r) => setOrders(r.data)).catch(() => setOrders([]));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-8 lg:px-12" data-testid="account-page">
      <div className="flex items-center gap-4 border-b border-[#1E2330] pb-8">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[#1E2330] bg-[#0F1117]">
          {user?.picture ? <img src={user.picture} alt="" className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-slate-400" />}
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">{user?.name || "Operator"}</h1>
          <p className="font-mono text-[11px] uppercase tracking-mono text-slate-500">{user?.email} · {user?.role}</p>
        </div>
      </div>

      <h2 className="mt-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-mono text-slate-400">
        <Package className="h-4 w-4" /> Order History
      </h2>

      {orders === null ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton-shine h-24 rounded-lg bg-[#171A23]" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-[#1E2330] py-16 text-center" data-testid="no-orders">
          <p className="text-sm text-slate-400">No orders yet.</p>
          <Button asChild className="mt-3 bg-[color:var(--thermo)] font-mono text-xs uppercase tracking-mono text-[#07080C]"><Link to="/catalog">Start Shopping</Link></Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border border-[#1E2330] bg-[#0F1117] p-5" data-testid={`order-${o.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-sm" style={{ color: "var(--thermo)" }}>{o.tracking_hash}</span>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-mono text-slate-500">
                    {new Date(o.created_at).toLocaleDateString()} · {o.items.length} item(s) · {o.shipping_tier}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-sm bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-mono text-emerald-400">{o.status}</span>
                  <p className="mt-1 font-mono text-sm font-bold tabular-nums">${o.total.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {o.items.map((i, idx) => i.image && (
                  <img key={idx} src={i.image} alt={i.name} className="h-12 w-10 rounded object-cover" title={i.name} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
