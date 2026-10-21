import { createContext, useContext, useEffect, useState, useMemo } from "react";

const WishlistContext = createContext(null);
const STORAGE_KEY = "tg_wishlist_v1";

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const isSaved = (id) => items.some((p) => p.id === id);

  const toggle = (product) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      // store a lightweight snapshot sufficient for ProductCard
      const { id, name, images, price, material, eco_rating, activation_temp, color_palette, is_new } = product;
      return [...prev, { id, name, images, price, material, eco_rating, activation_temp, color_palette, is_new }];
    });
  };

  const remove = (id) => setItems((prev) => prev.filter((p) => p.id !== id));

  const count = useMemo(() => items.length, [items]);

  return (
    <WishlistContext.Provider value={{ items, isSaved, toggle, remove, count }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
