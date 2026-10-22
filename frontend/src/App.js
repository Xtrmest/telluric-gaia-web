import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { TempProvider } from "./context/TempContext";
import { WishlistProvider } from "./context/WishlistContext";
import { Layout } from "./components/Layout";
import { AuthCallback } from "./components/AuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import DepartmentPage from "./pages/DepartmentPage";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Wishlist from "./pages/Wishlist";
import FittingRoom from "./pages/FittingRoom";

const WOMEN_TABS = [
  { id: "all", label: "All Women's", filter: {} },
  { id: "tops", label: "T-Shirts & Tops", filter: { category: "T-Shirts & Tops" } },
  { id: "sweaters", label: "Sweaters & Knitwear", filter: { category: "Sweaters & Knitwear" } },
  { id: "bottoms", label: "Pants & Shorts", filter: { category: "Pants & Shorts" } },
  { id: "lingerie", label: "Sexy Lingerie", filter: { subcategory: "Sexy Lingerie" } },
  { id: "underwear", label: "Bras & Underwear", filter: { subcategory: "Underwear & Bras" } },
  { id: "active", label: "Women's Activewear", filter: { category: "Activewear & Workout" } },
];

const MEN_TABS = [
  { id: "all", label: "All Men's", filter: {} },
  { id: "tops", label: "T-Shirts & Tops", filter: { category: "T-Shirts & Tops" } },
  { id: "sweaters", label: "Sweaters & Knitwear", filter: { category: "Sweaters & Knitwear" } },
  { id: "bottoms", label: "Pants & Shorts", filter: { category: "Pants & Shorts" } },
  { id: "underwear", label: "Men's Underwear", filter: { subcategory: "Men's Underwear" } },
  { id: "active", label: "Men's Activewear", filter: { category: "Activewear & Workout" } },
];

const INTIMATES_TABS = [
  { id: "all", label: "All Intimates & Lingerie", filter: {} },
  { id: "sexy-lingerie", label: "Women's Sexy Lingerie", filter: { subcategory: "Sexy Lingerie" } },
  { id: "womens-underwear", label: "Women's Bras & Underwear", filter: { subcategory: "Underwear & Bras" } },
  { id: "mens-underwear", label: "Men's Bamboo & Hemp Underwear", filter: { subcategory: "Men's Underwear" } },
];

const ACTIVEWEAR_TABS = [
  { id: "all", label: "All Blank Activewear", filter: {} },
  { id: "women", label: "Women's Workout", filter: { gender: "Women" } },
  { id: "men", label: "Men's Workout", filter: { gender: "Men" } },
];

const SEASONS_TABS = [
  { id: "all", label: "All 4 Seasons", filter: {} },
  { id: "spring", label: "Spring Collection", filter: { season: "Spring" } },
  { id: "summer", label: "Summer Collection", filter: { season: "Summer" } },
  { id: "autumn", label: "Autumn Collection", filter: { season: "Autumn" } },
  { id: "winter", label: "Winter Collection", filter: { season: "Winter" } },
];

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/women"
          element={
            <DepartmentPage
              eyebrow="// Women's Bamboo & Hemp Sanctuary"
              title="Women's Collection"
              subtitle="Generic organic bamboo & hemp T-shirts, cozy knit sweaters, wide-leg pants, shorts, everyday bras & underwear, luxury sexy lingerie, and unbranded studio activewear."
              heroImage="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85"
              defaultGender="Women"
              tabs={WOMEN_TABS}
            />
          }
        />
        <Route
          path="/men"
          element={
            <DepartmentPage
              eyebrow="// Men's Bamboo & Hemp Architecture"
              title="Men's Collection"
              subtitle="Clean, unbranded heavyweight hemp & bamboo T-shirts, thermal sweaters, tailored trousers, lounge shorts, breathable bamboo silk underwear, and blank workout gear."
              heroImage="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=85"
              defaultGender="Men"
              tabs={MEN_TABS}
            />
          }
        />
        <Route
          path="/intimates"
          element={
            <DepartmentPage
              eyebrow="// Boudoir Lingerie & Second-Skin Intimates"
              title="Underwear & Sexy Lingerie"
              subtitle="Sensual bamboo-lace plunge bodysuits, strappy silk-bamboo garter sets, bias-cut satin slips, wireless bralettes, and men's breathable bamboo-hemp boxer briefs."
              heroImage="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85"
              defaultCategory="Underwear & Lingerie"
              tabs={INTIMATES_TABS}
            />
          }
        />
        <Route
          path="/activewear"
          element={
            <DepartmentPage
              eyebrow="// Pure Athletic Form · Zero Logos"
              title="Activewear & Workout"
              subtitle="Personalized athletic cuts crafted from 4-way stretch bamboo compression knit and breathable hemp mesh — completely free of external branding or designs."
              heroImage="https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1200&q=85"
              defaultCategory="Activewear & Workout"
              tabs={ACTIVEWEAR_TABS}
            />
          }
        />
        <Route
          path="/seasons"
          element={
            <DepartmentPage
              eyebrow="// Spring · Summer · Autumn · Winter"
              title="Four-Season Wardrobe"
              subtitle="Thermoregulating bamboo and raw hemp garments engineered for breathable summer heat, crisp spring air, layered autumn transitions, and deep winter warmth."
              heroImage="https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85"
              tabs={SEASONS_TABS}
            />
          }
        />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/fitting-room" element={<FittingRoom />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:id" element={<OrderConfirmation />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <div className="App grain">
      <BrowserRouter>
        <AuthProvider>
          <TempProvider>
            <CartProvider>
              <WishlistProvider>
                <AppRouter />
                <Toaster
                  theme="dark"
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      background: "#0F1117",
                      border: "1px solid #1E2330",
                      color: "#F1F5F9",
                    },
                  }}
                />
              </WishlistProvider>
            </CartProvider>
          </TempProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
