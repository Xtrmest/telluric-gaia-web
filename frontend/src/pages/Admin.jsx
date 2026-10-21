import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Package, ShoppingBag } from "lucide-react";
import { api, formatApiErrorDetail } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

const MATERIALS = ["Hemp Canvas", "Bamboo Micro-Knit", "Recycled Bio-Polymer", "Organic Bio-Fleece"];
const PALETTES = ["Cold Cyan", "Ember Amber", "Bio Olive", "Void Black"];

const EMPTY = {
  name: "", description: "", price: 100, material: MATERIALS[0], color_palette: PALETTES[0],
  images_text: "", eco_rating: 96, carbon_label: "96% Carbon Negative", stock: 25,
  composition_text: "Raw Hemp:70\nBamboo Rayon:30", activation_temp: "None",
  chest: "", sleeve: "", length: "", fiber_density: "", tensile_strength: "", weight_gsm: "",
  is_new: true, featured: false,
};

export default function Admin() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState(null);
  const [orders, setOrders] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadProducts = useCallback(async () => {
    const { data } = await api.get("/products");
    setProducts(data);
  }, []);

  useEffect(() => {
    loadProducts();
    api.get("/orders").then((r) => setOrders(r.data)).catch(() => setOrders([]));
  }, [loadProducts]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description, price: p.price, material: p.material,
      color_palette: p.color_palette, images_text: (p.images || []).join("\n"),
      eco_rating: p.eco_rating, carbon_label: p.carbon_label, stock: p.stock,
      composition_text: (p.composition || []).map((c) => `${c.material}:${c.percent}`).join("\n"),
      activation_temp: p.activation_temp || "None",
      chest: p.tech_pack?.chest || "", sleeve: p.tech_pack?.sleeve || "", length: p.tech_pack?.length || "",
      fiber_density: p.tech_pack?.fiber_density || "", tensile_strength: p.tech_pack?.tensile_strength || "",
      weight_gsm: p.tech_pack?.weight_gsm || "",
      is_new: p.is_new, featured: p.featured,
    });
    setDialogOpen(true);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        material: form.material,
        color_palette: form.color_palette,
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        images: form.images_text.split("\n").map((s) => s.trim()).filter(Boolean),
        eco_rating: parseFloat(form.eco_rating) || 0,
        carbon_label: form.carbon_label,
        stock: parseInt(form.stock) || 0,
        composition: form.composition_text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => {
            const [material, percent] = l.split(":");
            return { material: (material || "").trim(), percent: parseFloat(percent) || 0 };
          }),
        tech_pack: {
          chest: form.chest, sleeve: form.sleeve, length: form.length,
          fiber_density: form.fiber_density, tensile_strength: form.tensile_strength,
          weight_gsm: form.weight_gsm,
        },
        activation_temp: form.activation_temp,
        is_new: form.is_new,
        featured: form.featured,
      };
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product created");
      }
      setDialogOpen(false);
      loadProducts();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success("Product deleted");
      loadProducts();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-12" data-testid="admin-page">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2330] pb-6">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">// Lab Control</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tighter sm:text-4xl">Admin Panel</h1>
        </div>
        <Button onClick={openAdd} data-testid="admin-add-product-btn" className="bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C]">
          <Plus className="mr-1.5 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="mt-6 flex gap-2">
        {[["products", "Products", Package], ["orders", "Orders", ShoppingBag]].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            data-testid={`admin-tab-${id}`}
            className={`flex items-center gap-2 rounded-md border px-4 py-2 font-mono text-[11px] uppercase tracking-mono transition-colors ${tab === id ? "border-[color:var(--thermo)] text-[color:var(--thermo)]" : "border-[#1E2330] text-slate-400"}`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#1E2330]">
          {products === null ? (
            <div className="space-y-px">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-shine h-16 bg-[#171A23]" />)}</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E2330] bg-[#0F1117]">
                  {["Product", "Material", "Price", "Stock", "Flags", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-mono text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-[#1E2330] last:border-0 hover:bg-[#0F1117]" data-testid={`admin-product-row-${p.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0]} alt="" className="h-11 w-9 rounded object-cover" />
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{p.material}</td>
                    <td className="px-4 py-3 font-mono text-sm tabular-nums">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-sm tabular-nums">{p.stock}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {p.is_new && <span className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-emerald-400">New</span>}
                        {p.featured && <span className="rounded-sm bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-cyan-400">Feat</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} data-testid={`admin-edit-${p.id}`} className="text-slate-400 hover:text-[color:var(--thermo)]"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(p.id)} data-testid={`admin-delete-${p.id}`} className="text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-6 space-y-3">
          {orders === null ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-shine h-20 rounded-lg bg-[#171A23]" />)
          ) : orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#1E2330] py-16 text-center text-sm text-slate-400" data-testid="admin-no-orders">No orders yet.</div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#1E2330] bg-[#0F1117] p-4" data-testid={`admin-order-${o.id}`}>
                <div>
                  <span className="font-mono text-sm" style={{ color: "var(--thermo)" }}>{o.tracking_hash}</span>
                  <p className="font-mono text-[10px] uppercase tracking-mono text-slate-500">{o.shipping?.email} · {new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-bold tabular-nums">${o.total.toFixed(2)}</span>
                  <p className="font-mono text-[10px] uppercase tracking-mono text-slate-500">{o.items.length} item(s)</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1E2330] bg-[#0F1117] sm:max-w-2xl" data-testid="admin-product-dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-extrabold uppercase tracking-tight">{editing ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AField label="Name" full><Input value={form.name} onChange={set("name")} data-testid="form-name" className="border-[#1E2330] bg-[#07080C]" /></AField>
            <AField label="Description" full><Textarea value={form.description} onChange={set("description")} data-testid="form-description" className="border-[#1E2330] bg-[#07080C]" /></AField>
            <AField label="Price (USD)"><Input type="number" value={form.price} onChange={set("price")} data-testid="form-price" className="border-[#1E2330] bg-[#07080C]" /></AField>
            <AField label="Stock"><Input type="number" value={form.stock} onChange={set("stock")} data-testid="form-stock" className="border-[#1E2330] bg-[#07080C]" /></AField>
            <AField label="Material">
              <Select value={form.material} onValueChange={(v) => setForm((f) => ({ ...f, material: v }))}>
                <SelectTrigger data-testid="form-material" className="border-[#1E2330] bg-[#07080C]"><SelectValue /></SelectTrigger>
                <SelectContent className="border-[#1E2330] bg-[#0F1117]">{MATERIALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </AField>
            <AField label="Color Palette">
              <Select value={form.color_palette} onValueChange={(v) => setForm((f) => ({ ...f, color_palette: v }))}>
                <SelectTrigger data-testid="form-palette" className="border-[#1E2330] bg-[#07080C]"><SelectValue /></SelectTrigger>
                <SelectContent className="border-[#1E2330] bg-[#0F1117]">{PALETTES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </AField>
            <AField label="Eco Rating (%)"><Input type="number" value={form.eco_rating} onChange={set("eco_rating")} data-testid="form-eco" className="border-[#1E2330] bg-[#07080C]" /></AField>
            <AField label="Carbon Label"><Input value={form.carbon_label} onChange={set("carbon_label")} className="border-[#1E2330] bg-[#07080C]" /></AField>
            <AField label="Image URLs (one per line)" full><Textarea value={form.images_text} onChange={set("images_text")} rows={3} data-testid="form-images" className="border-[#1E2330] bg-[#07080C] font-mono text-xs" /></AField>
            <AField label="Composition (Material:percent per line)" full><Textarea value={form.composition_text} onChange={set("composition_text")} rows={3} data-testid="form-composition" className="border-[#1E2330] bg-[#07080C] font-mono text-xs" /></AField>
            <AField label="Chest"><Input value={form.chest} onChange={set("chest")} className="border-[#1E2330] bg-[#07080C]" /></AField>
            <AField label="Sleeve"><Input value={form.sleeve} onChange={set("sleeve")} className="border-[#1E2330] bg-[#07080C]" /></AField>
            <AField label="Length"><Input value={form.length} onChange={set("length")} className="border-[#1E2330] bg-[#07080C]" /></AField>
            <AField label="Fiber Density"><Input value={form.fiber_density} onChange={set("fiber_density")} className="border-[#1E2330] bg-[#07080C]" /></AField>
            <AField label="Tensile Strength"><Input value={form.tensile_strength} onChange={set("tensile_strength")} className="border-[#1E2330] bg-[#07080C]" /></AField>
            <AField label="Weight (GSM)"><Input value={form.weight_gsm} onChange={set("weight_gsm")} className="border-[#1E2330] bg-[#07080C]" /></AField>
            <div className="flex items-center gap-3"><Switch checked={form.is_new} onCheckedChange={(v) => setForm((f) => ({ ...f, is_new: v }))} data-testid="form-isnew" /><Label className="font-mono text-[10px] uppercase tracking-mono text-slate-400">New Drop</Label></div>
            <div className="flex items-center gap-3"><Switch checked={form.featured} onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))} data-testid="form-featured" /><Label className="font-mono text-[10px] uppercase tracking-mono text-slate-400">Featured</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#2A3245] font-mono text-xs uppercase tracking-mono">Cancel</Button>
            <Button onClick={submit} disabled={busy || !form.name} data-testid="form-submit" className="bg-[color:var(--thermo)] font-mono text-xs font-bold uppercase tracking-mono text-[#07080C]">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editing ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="border-[#1E2330] bg-[#0F1117]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">This permanently removes the product from the catalog.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2A3245] bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="confirm-delete-btn" className="bg-red-500 text-white hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AField({ label, children, full }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="font-mono text-[10px] uppercase tracking-mono text-slate-400">{label}</Label>
      {children}
    </div>
  );
}
