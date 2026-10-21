import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Loader2, Truck, CreditCard, Package } from "lucide-react";
import { api, formatApiErrorDetail } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { PayPalCheckout } from "../components/PayPalCheckout";

const TIERS = [
  { id: "Standard Eco", label: "Standard Eco", desc: "Carbon-neutral · 5-7 days", cost: 0 },
  { id: "Express Grid", label: "Express Grid", desc: "Offset shipping · 2-3 days", cost: 18 },
];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [tier, setTier] = useState(TIERS[0]);
  const [busy, setBusy] = useState(false);
  const [payMethod, setPayMethod] = useState("demo");
  const [shipping, setShipping] = useState({
    full_name: user?.name || "",
    email: user?.email || "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
  });

  const total = subtotal + tier.cost;

  if (items.length === 0 && !busy) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-32 text-center" data-testid="checkout-empty">
        <Package className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-4 text-slate-400">Your cart is empty.</p>
        <Button onClick={() => navigate("/catalog")} className="mt-4 bg-[color:var(--thermo)] font-mono text-xs uppercase tracking-mono text-[#07080C]">Browse Catalog</Button>
      </div>
    );
  }

  const set = (k) => (e) => setShipping((s) => ({ ...s, [k]: e.target.value }));
  const shippingValid = Object.values(shipping).every((v) => v.trim());

  const buildPaypalPayload = () => ({
    items: items.map(({ product_id, name, image, size, color, price, quantity }) => ({
      product_id, name, image, size, color, price, quantity,
    })),
    shipping,
    shipping_tier: tier.id,
    shipping_cost: tier.cost,
  });

  const handlePaypalSuccess = (order) => {
    clearCart();
    toast.success("Payment complete");
    navigate(`/order/${order.id}`, { state: { order } });
  };

  const placeOrder = async () => {
    setBusy(true);
    try {
      const payload = {
        items: items.map(({ product_id, name, image, size, color, price, quantity }) => ({
          product_id, name, image, size, color, price, quantity,
        })),
        shipping,
        shipping_tier: tier.id,
        shipping_cost: tier.cost,
        subtotal,
        total,
      };
      const { data } = await api.post("/orders", payload);
      clearCart();
      toast.success("Order confirmed");
      navigate(`/order/${data.id}`, { state: { order: data } });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
      setBusy(false);
    }
  };

  const steps = [
    { n: 1, label: "Shipping", icon: Truck },
    { n: 2, label: "Delivery", icon: Package },
    { n: 3, label: "Payment", icon: CreditCard },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 lg:px-12" data-testid="checkout-page">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tighter sm:text-4xl">Checkout</h1>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center gap-2">
            <div className={`flex items-center gap-2 ${step >= s.n ? "text-[color:var(--thermo)]" : "text-slate-600"}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${step >= s.n ? "border-[color:var(--thermo)]" : "border-[#1E2330]"}`}>
                {step > s.n ? <Check className="h-4 w-4" /> : s.n}
              </span>
              <span className="hidden font-mono text-[10px] uppercase tracking-mono sm:block">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`h-px flex-1 ${step > s.n ? "bg-[color:var(--thermo)]" : "bg-[#1E2330]"}`} />}
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 rounded-xl border border-[#1E2330] bg-[#0F1117] p-6" data-testid="step-shipping">
              <h2 className="font-mono text-[11px] uppercase tracking-mono text-slate-400">Shipping Tech Pack</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name" value={shipping.full_name} onChange={set("full_name")} testid="ship-name" full />
                <Field label="Email" type="email" value={shipping.email} onChange={set("email")} testid="ship-email" full />
                <Field label="Address" value={shipping.address} onChange={set("address")} testid="ship-address" full />
                <Field label="City" value={shipping.city} onChange={set("city")} testid="ship-city" />
                <Field label="Postal Code" value={shipping.postal_code} onChange={set("postal_code")} testid="ship-postal" />
                <Field label="Country" value={shipping.country} onChange={set("country")} testid="ship-country" full />
              </div>
              <Button
                disabled={!shippingValid}
                onClick={() => setStep(2)}
                data-testid="checkout-to-delivery"
                className="w-full bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C] hover:opacity-90"
              >
                Continue to Delivery
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 rounded-xl border border-[#1E2330] bg-[#0F1117] p-6" data-testid="step-delivery">
              <h2 className="font-mono text-[11px] uppercase tracking-mono text-slate-400">Eco Delivery Tier</h2>
              {TIERS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTier(t)}
                  data-testid={`tier-${t.id.toLowerCase().replace(/\s/g, "-")}`}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors ${tier.id === t.id ? "border-[color:var(--thermo)]" : "border-[#1E2330] hover:border-[#2A3245]"}`}
                >
                  <div>
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="font-mono text-[10px] uppercase tracking-mono text-slate-500">{t.desc}</div>
                  </div>
                  <span className="font-mono text-sm">{t.cost === 0 ? "Free" : `$${t.cost}`}</span>
                </button>
              ))}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-[#2A3245] font-mono text-xs uppercase tracking-mono">Back</Button>
                <Button onClick={() => setStep(3)} data-testid="checkout-to-payment" className="flex-1 bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C]">Continue to Payment</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 rounded-xl border border-[#1E2330] bg-[#0F1117] p-6" data-testid="step-payment">
              <h2 className="font-mono text-[11px] uppercase tracking-mono text-slate-400">Payment Protocol</h2>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPayMethod("demo")}
                  data-testid="paymethod-demo"
                  className={`rounded-md border px-3 py-3 text-left transition-colors ${payMethod === "demo" ? "border-[color:var(--thermo)]" : "border-[#1E2330] hover:border-[#2A3245]"}`}
                >
                  <div className="text-sm font-medium">Demo Checkout</div>
                  <div className="font-mono text-[9px] uppercase tracking-mono text-slate-500">Simulated · no charge</div>
                </button>
                <button
                  onClick={() => setPayMethod("paypal")}
                  data-testid="paymethod-paypal"
                  className={`rounded-md border px-3 py-3 text-left transition-colors ${payMethod === "paypal" ? "border-[color:var(--thermo)]" : "border-[#1E2330] hover:border-[#2A3245]"}`}
                >
                  <div className="text-sm font-medium">PayPal / Card</div>
                  <div className="font-mono text-[9px] uppercase tracking-mono text-slate-500">Secure · {`sandbox`}</div>
                </button>
              </div>

              {payMethod === "demo" ? (
                <>
                  <div className="rounded-lg border border-dashed border-[#2A3245] bg-[#07080C] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-mono text-[color:var(--thermo)]">Demo Mode</p>
                    <p className="mt-1 text-sm text-slate-400">This is a simulated checkout — no real payment is processed. Card fields are illustrative only.</p>
                  </div>
                  <Field label="Card Number" value="4242 4242 4242 4242" onChange={() => {}} testid="pay-card" full disabled />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Expiry" value="12 / 29" onChange={() => {}} testid="pay-exp" disabled />
                    <Field label="CVC" value="123" onChange={() => {}} testid="pay-cvc" disabled />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-[#2A3245] font-mono text-xs uppercase tracking-mono">Back</Button>
                    <Button onClick={placeOrder} disabled={busy} data-testid="place-order-btn" className="flex-1 bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C]">
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Place Order
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">Pay securely with PayPal or a debit/credit card.</p>
                  <PayPalCheckout buildPayload={buildPaypalPayload} onSuccess={handlePaypalSuccess} />
                  <Button variant="outline" onClick={() => setStep(2)} className="w-full border-[#2A3245] font-mono text-xs uppercase tracking-mono">Back</Button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4 rounded-xl border border-[#1E2330] bg-[#0F1117] p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-mono text-slate-400">Order Summary</h2>
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.key} className="flex items-center gap-3">
                  <img src={i.image} alt={i.name} className="h-14 w-11 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{i.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-mono text-slate-500">{i.size} · {i.color} · ×{i.quantity}</p>
                  </div>
                  <span className="font-mono text-sm tabular-nums">${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-[#1E2330] pt-4 text-sm">
              <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
              <Row label="Shipping" value={tier.cost === 0 ? "Free" : `$${tier.cost.toFixed(2)}`} />
              <div className="flex items-center justify-between border-t border-[#1E2330] pt-3">
                <span className="font-mono text-xs uppercase tracking-mono">Total</span>
                <span data-testid="checkout-total" className="font-mono text-lg font-bold tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", testid, full, disabled }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="font-mono text-[10px] uppercase tracking-mono text-slate-400">{label}</Label>
      <Input type={type} value={value} onChange={onChange} disabled={disabled} data-testid={testid} className="border-[#1E2330] bg-[#07080C]" />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-slate-400">
      <span>{label}</span>
      <span className="font-mono tabular-nums text-slate-200">{value}</span>
    </div>
  );
}
