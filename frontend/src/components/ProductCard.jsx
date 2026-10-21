import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Plus, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export const ProductCard = ({ product, index = 0 }) => {
  const { addItem } = useCart();
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(product.id);

  const quickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, "M", product.color_palette, 1);
  };

  const toggleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4) }}
      data-testid={`product-card-${product.id}`}
    >
      <Link
        to={`/product/${product.id}`}
        className="group relative block overflow-hidden rounded-lg border border-[#1E2330] bg-[#0F1117] transition-colors hover:border-[#2A3245]"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-[#07080C]">
          <img
            src={product.images?.[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-transparent to-transparent opacity-80" />

          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.is_new && (
              <span
                className="rounded-sm px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-mono text-[#07080C]"
                style={{ background: "#10B981" }}
              >
                New Drop
              </span>
            )}
          </div>

          <button
            onClick={toggleSave}
            data-testid={`wishlist-toggle-${product.id}`}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border backdrop-blur-xl transition-colors ${
              saved ? "border-transparent bg-[color:var(--thermo)] text-[#07080C]" : "border-[#1E2330] bg-[#07080C]/70 text-slate-300 hover:border-[color:var(--thermo)]"
            }`}
          >
            <Heart className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
          </button>

          <button
            onClick={quickAdd}
            data-testid={`quick-add-${product.id}`}
            className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-md bg-[color:var(--thermo)] text-[#07080C] opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            aria-label="Quick add to cart"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-tight text-slate-100">{product.name}</h3>
            <span className="shrink-0 font-mono text-sm tabular-nums text-slate-200">${product.price.toFixed(0)}</span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-mono text-slate-500">{product.material}</p>
          <div className="flex items-center gap-1.5 pt-1">
            <Leaf className="h-3 w-3 text-emerald-400" />
            <span className="font-mono text-[10px] text-emerald-400/90">{product.eco_rating}% eco score</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-[#1E2330] bg-[#0F1117]">
    <div className="skeleton-shine aspect-[3/4] bg-[#171A23]" />
    <div className="space-y-2.5 p-4">
      <div className="skeleton-shine h-4 w-3/4 rounded bg-[#171A23]" />
      <div className="skeleton-shine h-3 w-1/2 rounded bg-[#171A23]" />
      <div className="skeleton-shine h-3 w-1/3 rounded bg-[#171A23]" />
    </div>
  </div>
);
