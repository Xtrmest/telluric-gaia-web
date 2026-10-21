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
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Wishlist from "./pages/Wishlist";
import FittingRoom from "./pages/FittingRoom";

function AppRouter() {
  const location = useLocation(); // read hash from here (reactive)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route
          path="/fitting-room"
          element={
            <ProtectedRoute>
              <FittingRoom />
            </ProtectedRoute>
          }
        />
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
