import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { api } from "../lib/api";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchTerm = searchParams.get("search") || "";
  const [products, setProducts] = useState(null);
  const [filters, setFilters] = useState({
    genders: [],
    categories: [],
    seasons: [],
    materials: [],
    sizes: [],
    palettes: [],
  });
  const [gender, setGender] = useState(searchParams.get("gender") || "all");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [season, setSeason] = useState(searchParams.get("season") || "all");
  const [material, setMaterial] = useState("all");
  const [size, setSize] = useState("all");
  const [palette, setPalette] = useState("all");
  const [sort, setSort] = useState("newest");
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    api.get("/products/meta/filters").then((r) => setFilters(r.data));
  }, []);

  const load = useCallback(async () => {
    setProducts(null);
    const params = { sort };
    if (gender !== "all") params.gender = gender;
    if (category !== "all") params.category = category;
    if (season !== "all") params.season = season;
    if (material !== "all") params.material = material;
    if (size !== "all") params.size = size;
    if (palette !== "all") params.palette = palette;
    if (searchParams.get("filter") === "new") params.is_new = true;
    if (searchTerm) params.search = searchTerm;
    const { data } = await api.get("/products", { params });
    setProducts(data);
  }, [gender, category, season, material, size, palette, sort, searchParams, searchTerm]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setGender("all");
    setCategory("all");
    setSeason("all");
    setMaterial("all");
    setSize("all");
    setPalette("all");
    setSort("newest");
  };

  const activeCount = [gender, category, season, material, size, palette].filter(
    (v) => v !== "all"
  ).length;

  const FilterControls = () => (
    <div className="space-y-5">
      <FilterGroup label="Department" value={gender} onChange={setGender} options={filters.genders || ["Women", "Men"]} testid="filter-gender" />
      <FilterGroup label="Category" value={category} onChange={setCategory} options={filters.categories || []} testid="filter-category" />
      <FilterGroup label="Season" value={season} onChange={setSeason} options={filters.seasons || ["Spring", "Summer", "Autumn", "Winter"]} testid="filter-season" />
      <FilterGroup label="Material Type" value={material} onChange={setMaterial} options={filters.materials || []} testid="filter-material" />
      <FilterGroup label="Sizing" value={size} onChange={setSize} options={filters.sizes || []} testid="filter-size" />
      <FilterGroup label="Colorway" value={palette} onChange={setPalette} options={filters.palettes || []} testid="filter-palette" />
      {activeCount > 0 && (
        <Button variant="ghost" onClick={reset} className="w-full justify-start px-0 text-slate-400 hover:text-[color:var(--thermo)]" data-testid="filter-reset">
          <X className="mr-1.5 h-3.5 w-3.5" /> Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-12" data-testid="catalog-page">
      <div className="flex flex-col gap-2 border-b border-[#1E2330] pb-8">
        <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">
          // Full Four-Season Collection
        </span>
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tighter sm:text-5xl">
          Bamboo &amp; Hemp Archive
        </h1>
        {searchTerm ? (
          <div className="flex items-center gap-2" data-testid="catalog-search-banner">
            <span className="text-sm text-slate-400">Results for</span>
            <span className="rounded-full bg-[color:var(--thermo)] px-3 py-0.5 font-mono text-[11px] uppercase tracking-mono text-[#07080C]">
              {searchTerm}
            </span>
            <button
              onClick={() => navigate("/catalog")}
              data-testid="clear-search-btn"
              className="font-mono text-[11px] uppercase tracking-mono text-slate-500 hover:text-[color:var(--thermo)]"
            >
              <X className="inline h-3 w-3" /> clear
            </button>
          </div>
        ) : (
          <p className="max-w-xl text-sm text-slate-400">
            Explore generic Bamboo &amp; Hemp T-shirts, sweaters, pants, shorts, men&apos;s &amp; women&apos;s underwear, luxury sexy lingerie, and unbranded activewear across all four seasons.
          </p>
        )}
      </div>

      <div className="mt-8 flex gap-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-mono text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </div>
            <FilterControls />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setMobileFilters((v) => !v)}
                className="border-[#2A3245] font-mono text-[11px] uppercase tracking-mono lg:hidden"
                data-testid="mobile-filter-toggle"
              >
                <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> Filters {activeCount > 0 ? `(${activeCount})` : ""}
              </Button>
              <span className="hidden font-mono text-[11px] uppercase tracking-mono text-slate-500 sm:block" data-testid="result-count">
                {products ? `${products.length} items` : "loading…"}
              </span>
            </div>
            <div className="w-44">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="border-[#1E2330] bg-[#0F1117] font-mono text-[11px] uppercase tracking-mono" data-testid="sort-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#1E2330] bg-[#0F1117]">
                  <SelectItem value="newest">Newest Drop</SelectItem>
                  <SelectItem value="eco">Eco Rating</SelectItem>
                  <SelectItem value="price_asc">Price: Low→High</SelectItem>
                  <SelectItem value="price_desc">Price: High→Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {mobileFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mb-6 overflow-hidden rounded-lg border border-[#1E2330] bg-[#0F1117] p-5 lg:hidden"
            >
              <FilterControls />
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products === null
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>

          {products && products.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#1E2330] py-20 text-center" data-testid="catalog-empty">
              <p className="text-sm text-slate-400">No items match these filters.</p>
              <Button variant="ghost" onClick={reset} className="mt-2 text-[color:var(--thermo)]">Clear filters</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, value, onChange, options, testid }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-mono text-slate-500">{label}</div>
      <div className="flex flex-wrap gap-2">
        <Chip active={value === "all"} onClick={() => onChange("all")} testid={`${testid}-all`}>All</Chip>
        {options.map((o) => (
          <Chip key={o} active={value === o} onClick={() => onChange(o)} testid={`${testid}-${o.toLowerCase().replace(/\s/g, "-")}`}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-mono transition-colors ${
        active
          ? "border-transparent bg-[color:var(--thermo)] text-[#07080C]"
          : "border-[#1E2330] text-slate-400 hover:border-[#2A3245]"
      }`}
    >
      {children}
    </button>
  );
}
