import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Leaf, ArrowLeft, Check, Loader2, ShoppingBag, Heart, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useTemp } from "../context/TempContext";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "../components/ui/table";

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { isSaved, toggle } = useWishlist();
  const { accent } = useTemp();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState("M");

  useEffect(() => {
    window.scrollTo(0, 0);
    setProduct(null);
    api
      .get(`/products/${id}`)
      .then((r) => {
        setProduct(r.data);
        setActiveImg(0);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-32 text-center" data-testid="product-not-found">
        <p className="text-slate-400">Product not found.</p>
        <Button asChild variant="link" className="text-[color:var(--thermo)]"><Link to="/catalog">Back to catalog</Link></Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="skeleton-shine aspect-[4/5] rounded-xl bg-[#171A23] lg:col-span-7" />
          <div className="space-y-4 lg:col-span-5">
            <div className="skeleton-shine h-10 w-2/3 rounded bg-[#171A23]" />
            <div className="skeleton-shine h-6 w-24 rounded bg-[#171A23]" />
            <div className="skeleton-shine h-24 w-full rounded bg-[#171A23]" />
          </div>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    addItem(product, size, product.color_palette, 1);
    toast.success(`${product.name} (${size}) added to cart`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 lg:px-12" data-testid="product-detail-page">
      <Link to="/catalog" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-mono text-slate-500 hover:text-[color:var(--thermo)]">
        <ArrowLeft className="h-3.5 w-3.5" /> Catalog
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Gallery */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative overflow-hidden rounded-xl border border-[#1E2330] bg-[#0F1117]"
          >
            <img
              src={product.images?.[activeImg]}
              alt={product.name}
              className="aspect-[4/5] w-full object-cover transition-all duration-500"
              data-testid="product-main-image"
            />
          </motion.div>

          <div className="mt-4 flex gap-3">
            {product.images?.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                data-testid={`gallery-thumb-${i}`}
                className={`h-20 w-16 overflow-hidden rounded-md border transition-colors ${activeImg === i ? "border-[color:var(--thermo)]" : "border-[#1E2330]"}`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-mono text-slate-500">{product.material}</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-4">
            <span className="font-mono text-2xl font-bold tabular-nums">${product.price.toFixed(2)}</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
              <Leaf className="h-3.5 w-3.5" /> {product.carbon_label}
            </span>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-400">{product.description}</p>

          {/* Size */}
          <div className="mt-6">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-mono text-slate-500">Select Size</div>
            <div className="flex flex-wrap gap-2">
              {product.sizes?.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  data-testid={`size-${s}`}
                  className={`flex h-11 min-w-11 items-center justify-center rounded-md border px-3 font-mono text-xs font-bold uppercase transition-colors ${
                    size === s ? "border-[color:var(--thermo)] text-[color:var(--thermo)]" : "border-[#1E2330] text-slate-300 hover:border-[#2A3245]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-mono text-slate-500" data-testid="stock-status">
            <span className={`h-1.5 w-1.5 rounded-full ${product.stock > 0 ? "bg-emerald-400" : "bg-red-400"}`} />
            {product.stock > 0 ? `${product.stock} units in stock` : "Out of stock"}
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleAdd}
              disabled={product.stock <= 0}
              data-testid="add-to-cart-button"
              className="flex-1 bg-[color:var(--thermo)] py-6 font-mono text-xs font-bold uppercase tracking-mono text-[#07080C] hover:opacity-90"
            >
              <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
            <button
              onClick={() => toggle(product)}
              data-testid="product-wishlist-btn"
              aria-label="Save to wishlist"
              className={`flex w-14 shrink-0 items-center justify-center rounded-md border transition-colors ${
                isSaved(product.id) ? "border-transparent bg-[color:var(--thermo)] text-[#07080C]" : "border-[#2A3245] text-slate-300 hover:border-[color:var(--thermo)]"
              }`}
            >
              <Heart className="h-5 w-5" fill={isSaved(product.id) ? "currentColor" : "none"} />
            </button>
          </div>

          <Button
            asChild
            variant="outline"
            data-testid="try-on-btn"
            className="mt-3 w-full border-[color:var(--thermo)] bg-transparent py-5 font-mono text-xs font-bold uppercase tracking-mono text-[color:var(--thermo)] hover:bg-[var(--thermo-soft)]"
          >
            <Link to={`/fitting-room?product=${product.id}`}>
              <Sparkles className="mr-2 h-4 w-4" /> Try It On · Virtual Fitting Room
            </Link>
          </Button>

          {/* Tech pack tabs */}
          <Tabs defaultValue="composition" className="mt-8">
            <TabsList className="grid w-full grid-cols-2 bg-[#0F1117]">
              <TabsTrigger value="composition" data-testid="tab-composition" className="font-mono text-[10px] uppercase tracking-mono">Composition</TabsTrigger>
              <TabsTrigger value="techpack" data-testid="tab-techpack" className="font-mono text-[10px] uppercase tracking-mono">Tech Pack</TabsTrigger>
            </TabsList>

            <TabsContent value="composition" className="mt-4 space-y-3">
              {product.composition?.map((c) => (
                <div key={c.material}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{c.material}</span>
                    <span className="font-mono text-slate-400">{c.percent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1E2330]">
                    <div className="h-full rounded-full" style={{ width: `${c.percent}%`, background: accent }} />
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="techpack" className="mt-4">
              <div className="rounded-lg border border-[#1E2330]">
                <Table data-testid="tech-pack-table">
                  <TableBody>
                    {Object.entries({
                      Chest: product.tech_pack?.chest,
                      Sleeve: product.tech_pack?.sleeve,
                      Length: product.tech_pack?.length,
                      "Fiber Density": product.tech_pack?.fiber_density,
                      "Tensile Strength": product.tech_pack?.tensile_strength,
                      "Weight": product.tech_pack?.weight_gsm ? `${product.tech_pack.weight_gsm} GSM` : null,
                    })
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <TableRow key={k} className="border-[#1E2330]">
                          <TableCell className="font-mono text-[10px] uppercase tracking-mono text-slate-500">{k}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-slate-200">{v}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          <ul className="mt-6 space-y-2">
            {["Compostable at end of life", "Non-toxic low-impact dyes", "Carbon-negative supply chain"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                <Check className="h-3.5 w-3.5 text-emerald-400" /> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
