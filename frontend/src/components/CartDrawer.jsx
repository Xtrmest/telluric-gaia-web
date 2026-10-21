import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, Leaf, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Button } from "../components/ui/button";

export const CartDrawer = () => {
  const { items, open, setOpen, updateQty, removeItem, subtotal, count } = useCart();
  const navigate = useNavigate();

  const carbonOffset = (subtotal * 0.021).toFixed(2);

  const goCheckout = () => {
    setOpen(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-l border-[#1E2330] bg-[#0F1117] p-0 sm:max-w-md"
        data-testid="cart-drawer"
      >
        <SheetHeader className="border-b border-[#1E2330] px-6 py-5">
          <SheetTitle className="flex items-center justify-between font-display text-lg font-extrabold uppercase tracking-tight">
            <span>Cart <span className="font-mono text-xs text-slate-500">[{count}]</span></span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center" data-testid="cart-empty">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#1E2330]">
              <X className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-sm text-slate-400">Your cart is empty.</p>
            <Button
              variant="outline"
              onClick={() => { setOpen(false); navigate("/catalog"); }}
              className="border-[#2A3245] font-mono text-[11px] uppercase tracking-mono"
              data-testid="cart-browse-btn"
            >
              Browse Catalog
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {items.map((item) => (
                <motion.div
                  key={item.key}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-4 rounded-md border border-[#1E2330] bg-[#07080C] p-3"
                  data-testid={`cart-item-${item.product_id}`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-16 shrink-0 rounded object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium leading-tight text-slate-100">{item.name}</p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-mono text-slate-500">
                          {item.size} · {item.color}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.key)}
                        data-testid={`cart-remove-${item.product_id}`}
                        className="text-slate-600 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 rounded border border-[#1E2330]">
                        <button
                          onClick={() => updateQty(item.key, item.quantity - 1)}
                          data-testid={`cart-dec-${item.product_id}`}
                          className="px-2 py-1 text-slate-400 hover:text-[color:var(--thermo)]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-5 text-center font-mono text-xs tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.key, item.quantity + 1)}
                          data-testid={`cart-inc-${item.product_id}`}
                          className="px-2 py-1 text-slate-400 hover:text-[color:var(--thermo)]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-mono text-sm tabular-nums text-slate-200">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="space-y-4 border-t border-[#1E2330] px-6 py-5">
              <div className="flex items-center gap-2 rounded-md border border-[#1E2330] bg-[#07080C] px-3 py-2">
                <Leaf className="h-4 w-4 text-emerald-400" />
                <span className="font-mono text-[10px] uppercase tracking-mono text-slate-400">
                  Est. carbon offset:
                </span>
                <span className="ml-auto font-mono text-[11px] font-bold text-emerald-400">
                  {carbonOffset} kg CO₂e
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-mono text-slate-400">Subtotal</span>
                <span data-testid="cart-subtotal" className="font-mono text-lg font-bold tabular-nums">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={goCheckout}
                data-testid="cart-checkout-btn"
                className="w-full bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C] hover:opacity-90"
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
