import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { ProductCard } from "../components/ProductCard";
import { Button } from "../components/ui/button";

export default function Wishlist() {
  const { items } = useWishlist();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-12" data-testid="wishlist-page">
      <div className="flex flex-col gap-2 border-b border-[#1E2330] pb-8">
        <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">// Saved Shelf</span>
        <h1 className="flex items-center gap-3 font-display text-4xl font-extrabold uppercase tracking-tighter sm:text-5xl">
          Wishlist <span className="font-mono text-base text-slate-500">[{items.length}]</span>
        </h1>
        <p className="max-w-xl text-sm text-slate-400">Bookmarked drops. They'll stay here on this device until you're ready.</p>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-[#1E2330] py-20 text-center" data-testid="wishlist-empty">
          <Heart className="mx-auto h-9 w-9 text-slate-600" />
          <p className="mt-4 text-sm text-slate-400">No saved items yet.</p>
          <Button asChild className="mt-4 bg-[color:var(--thermo)] font-mono text-xs uppercase tracking-mono text-[#07080C]">
            <Link to="/catalog">Browse Catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
