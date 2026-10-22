import { Link } from "react-router-dom";
import { Sparkles, Leaf, Globe, ShieldCheck } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-[#1E2330] bg-[#07080C]" data-testid="site-footer">
      {/* Meaning of the Business Name Banner at the End of the Website */}
      <div className="border-b border-[#1E2330] bg-gradient-to-b from-[#0B0E17] to-[#07080C]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <span className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)]">
              // Etymology &amp; Sacred Foundation
            </span>
            <h2 className="mt-3 font-display text-2xl font-extrabold uppercase tracking-tight text-slate-100 sm:text-4xl">
              The Meaning of Telluric-Gaia Apparel Labs Inc.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
              Our name is a covenant between human vitality and the living planet — uniting ancient Earth wisdom with pure, unblemished bamboo and hemp craftsmanship.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-[#1E2330] bg-[#0F1117]/90 p-6">
              <div className="flex items-center gap-2.5">
                <Globe className="h-5 w-5 text-[color:var(--thermo)]" />
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-slate-100">
                  Telluric
                </h3>
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-mono text-slate-500">
                Latin &ldquo;Tellus&rdquo; · Of the Earth&apos;s Natural Currents
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                <strong>Telluric</strong> refers to terrestrial currents — the subtle, life-sustaining electromagnetic frequencies that flow through the Earth&apos;s crust and ground the human body&apos;s seven energy centers.
              </p>
            </div>

            <div className="rounded-xl border border-[#1E2330] bg-[#0F1117]/90 p-6">
              <div className="flex items-center gap-2.5">
                <Leaf className="h-5 w-5 text-emerald-400" />
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-slate-100">
                  Gaia
                </h3>
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-mono text-slate-500">
                Ancient Greek &ldquo;Gaîa&rdquo; · Living Mother Earth
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                <strong>Gaia</strong> embodies the ancestral Mother Earth as a single, self-regulating living biosphere where soil, plant fiber, and human skin exist in sacred, regenerative harmony.
              </p>
            </div>

            <div className="rounded-xl border border-[#1E2330] bg-[#0F1117]/90 p-6">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-slate-100">
                  Apparel Labs Inc.
                </h3>
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-mono text-slate-500">
                Pure Botanical Engineering · Zero Compromise
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                <strong>Apparel Labs Inc.</strong> is our sanctuary of textile innovation — spinning raw hemp and organic bamboo into elevated essentials, sensual intimates, and unbranded activewear across all four seasons.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Navigation */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 md:col-span-2">
            <div className="font-display text-base font-extrabold uppercase tracking-tight">
              Telluric-Gaia
              <span className="ml-1.5 font-mono text-[9px] text-slate-500">// APPAREL LABS INC.</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-slate-400">
              Luxury organic bamboo &amp; raw hemp clothing for Men and Women. Clean architectural basics, sensual intimates &amp; lingerie, unbranded workout gear, and custom 3-color chakra studio wear.
            </p>
            <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-mono text-emerald-400">
              <ShieldCheck className="h-4 w-4" /> 100% Bamboo &amp; Hemp · Four-Season Wardrobe
            </div>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-mono text-slate-500">Departments</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li><Link to="/women" className="hover:text-[color:var(--thermo)]">Women&apos;s Collection</Link></li>
              <li><Link to="/men" className="hover:text-[color:var(--thermo)]">Men&apos;s Collection</Link></li>
              <li><Link to="/intimates" className="hover:text-[color:var(--thermo)]">Underwear &amp; Sexy Lingerie</Link></li>
              <li><Link to="/activewear" className="hover:text-[color:var(--thermo)]">Unbranded Activewear</Link></li>
              <li><Link to="/seasons" className="hover:text-[color:var(--thermo)]">Four-Season Edit</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-mono text-slate-500">Experience</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li><Link to="/fitting-room" className="hover:text-[color:var(--thermo)]">3D &amp; Lotus Chakra Try-On</Link></li>
              <li><Link to="/catalog" className="hover:text-[color:var(--thermo)]">Full Catalog</Link></li>
              <li><Link to="/checkout" className="hover:text-[color:var(--thermo)]">Checkout</Link></li>
              <li><Link to="/about" className="hover:text-[color:var(--thermo)]">Eco Review &amp; Meaning</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-mono text-slate-500">Client Concierge</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li>concierge@telluricgaia.com</li>
              <li>Complimentary Eco-Shipping</li>
              <li>3-Color Botanical Ink Studio</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[#1E2330] pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[10px] uppercase tracking-mono text-slate-500">
            © 2026 Telluric-Gaia Apparel Labs Inc. All rights reserved.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-mono text-slate-500">
            Telluric (Earth Energy) · Gaia (Living Earth) · Carbon Negative
          </p>
        </div>
      </div>
    </footer>
  );
};
