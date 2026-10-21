import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-[#1E2330] bg-[#07080C]" data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="font-display text-base font-extrabold uppercase tracking-tight">
              Telluric Gaia
              <span className="ml-1.5 font-mono text-[9px] text-slate-500">// LABS</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Bio-synthetic tactical wear. Grown from hemp &amp; bamboo, crafted with regenerative material science.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-mono text-slate-500">Shop</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li><Link to="/catalog" className="hover:text-[color:var(--thermo)]">Full Catalog</Link></li>
              <li><Link to="/catalog?filter=new" className="hover:text-[color:var(--thermo)]">New Drops</Link></li>
              <li><Link to="/" className="hover:text-[color:var(--thermo)]">Collections</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-mono text-slate-500">Lab</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li><Link to="/about" className="hover:text-[color:var(--thermo)]">Eco Review</Link></li>
              <li><Link to="/about" className="hover:text-[color:var(--thermo)]">Material Science</Link></li>
              <li><Link to="/about" className="hover:text-[color:var(--thermo)]">Carbon Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-mono text-slate-500">Signal</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li>lab@telluricgaia.com</li>
              <li>Portland · Reykjavik</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[#1E2330] pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[10px] uppercase tracking-mono text-slate-600">
            © 2026 Telluric Gaia Apparel Lab Inc.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-mono text-slate-600">
            Carbon Negative · Compostable · Non-toxic
          </p>
        </div>
      </div>
    </footer>
  );
};
