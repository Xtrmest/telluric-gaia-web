import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, Search, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "./AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const NAV = [
  { label: "Women", to: "/women" },
  { label: "Men", to: "/men" },
  { label: "Intimates & Lingerie", to: "/intimates" },
  { label: "Activewear", to: "/activewear" },
  { label: "Seasons", to: "/seasons" },
  { label: "3D & Chakra Try-On", to: "/fitting-room" },
  { label: "All Catalog", to: "/catalog" },
];

export const Header = () => {
  const { count, setOpen } = useCart();
  const { count: wishCount } = useWishlist();
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-[#1E2330] bg-[#07080C]/80 backdrop-blur-2xl"
        data-testid="site-header"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-8 lg:px-12">
          <Link to="/" className="group flex items-center gap-2.5" data-testid="logo-link">
            <span className="relative flex h-7 w-7 items-center justify-center">
              <span className="absolute inset-0 rounded-sm border thermo-border opacity-70" />
              <span className="h-2.5 w-2.5 rounded-full thermo-bg-soft thermo-border border" style={{ background: "var(--thermo)" }} />
            </span>
            <span className="font-display text-sm font-extrabold uppercase tracking-tight leading-none">
              Telluric Gaia
              <span className="ml-1.5 font-mono text-[9px] font-medium tracking-mono text-slate-500">// LABS</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                data-testid={`nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
                className="font-mono text-[11px] uppercase tracking-mono text-slate-400 transition-colors hover:text-[color:var(--thermo)]"
              >
                {n.label}
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                data-testid="nav-admin"
                className="font-mono text-[11px] uppercase tracking-mono text-[color:var(--thermo)] hover:opacity-80"
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="hidden flex-1 justify-center px-4 md:flex lg:max-w-xs lg:flex-none">
            <HeaderSearch onNavigate={() => setMobileOpen(false)} />
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/wishlist"
              data-testid="nav-wishlist-button"
              className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[#1E2330] text-slate-300 transition-colors hover:border-[color:var(--thermo)] hover:text-[color:var(--thermo)]"
            >
              <Heart className="h-4 w-4" />
              <AnimatePresence>
                {wishCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    data-testid="wishlist-count-badge"
                    className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-[#07080C]"
                    style={{ background: "var(--thermo)" }}
                  >
                    {wishCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="account-menu-trigger"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-[#1E2330] text-slate-300 transition-colors hover:border-[color:var(--thermo)] hover:text-[color:var(--thermo)]"
                  >
                    <User className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-[#1E2330] bg-[#0F1117]">
                  <div className="px-2 py-1.5 text-xs text-slate-400">{user.email}</div>
                  <DropdownMenuItem onClick={() => navigate("/account")} data-testid="menu-account">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> My Orders
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="menu-admin">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={logout} data-testid="menu-logout">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                data-testid="open-auth-btn"
                onClick={() => setAuthOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#1E2330] text-slate-300 transition-colors hover:border-[color:var(--thermo)] hover:text-[color:var(--thermo)]"
              >
                <User className="h-4 w-4" />
              </button>
            )}

            <button
              data-testid="nav-cart-button"
              onClick={() => setOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[#1E2330] text-slate-300 transition-colors hover:border-[color:var(--thermo)] hover:text-[color:var(--thermo)]"
            >
              <ShoppingBag className="h-4 w-4" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    data-testid="cart-count-badge"
                    className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-[#07080C]"
                    style={{ background: "var(--thermo)" }}
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[#1E2330] text-slate-300 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#1E2330] lg:hidden"
            >
              <div className="space-y-1 px-4 py-4 sm:px-8">
                <div className="pb-2 md:hidden">
                  <HeaderSearch onNavigate={() => setMobileOpen(false)} />
                </div>
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2.5 font-mono text-xs uppercase tracking-mono text-slate-300 hover:bg-[#171A23]"
                  >
                    {n.label}
                  </Link>
                ))}
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2.5 font-mono text-xs uppercase tracking-mono text-[color:var(--thermo)]"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

const HeaderSearch = ({ onNavigate }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const timer = useRef(null);

  const go = (value, replace = false) => {
    const v = value.trim();
    navigate(v ? `/catalog?search=${encodeURIComponent(v)}` : "/catalog", { replace });
    if (onNavigate) onNavigate();
  };

  const onChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length >= 2) {
      timer.current = setTimeout(() => go(value, true), 350);
    }
  };

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        go(query);
      }}
      className="group relative w-full"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-[color:var(--thermo)]" />
      <input
        type="text"
        value={query}
        onChange={onChange}
        data-testid="header-search-input"
        placeholder="Search fabric or style…"
        className="w-full rounded-md border border-[#1E2330] bg-[#0F1117]/60 py-2 pl-9 pr-3 font-mono text-[11px] uppercase tracking-mono text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-[color:var(--thermo)]"
      />
    </form>
  );
};
