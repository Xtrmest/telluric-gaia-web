import { createContext, useContext, useEffect } from "react";

const TempContext = createContext(null);

const ACCENT = "rgb(0, 242, 254)";
const ACCENT_SOFT = "rgba(0, 242, 254, 0.14)";

export const TempProvider = ({ children }) => {
  useEffect(() => {
    document.documentElement.style.setProperty("--thermo", ACCENT);
    document.documentElement.style.setProperty("--thermo-soft", ACCENT_SOFT);
  }, []);

  return (
    <TempContext.Provider value={{ accent: ACCENT }}>
      {children}
    </TempContext.Provider>
  );
};

export const useTemp = () => useContext(TempContext);
