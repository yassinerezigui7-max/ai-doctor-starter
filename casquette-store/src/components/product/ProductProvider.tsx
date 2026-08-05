"use client";

import { config, type ColorId } from "@/config/site.config";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ProductState {
  colorId: ColorId;
  quantity: number;
  setColor: (id: ColorId) => void;
  setQuantity: (qty: number) => void;
}

const ProductContext = createContext<ProductState | null>(null);

/**
 * Owns the two pieces of state shared between the hero (color selector),
 * the sticky bar (live price) and the order form (color + quantity fields).
 * Everything else belongs to react-hook-form inside OrderForm.
 */
export function ProductProvider({ children }: { children: ReactNode }) {
  const [colorId, setColorId] = useState<ColorId>(config.colors[0].id);
  const [quantity, setQty] = useState<number>(config.quantity.default);

  const setColor = useCallback((id: ColorId) => setColorId(id), []);
  const setQuantity = useCallback((qty: number) => {
    setQty(Math.min(config.quantity.max, Math.max(config.quantity.min, Math.round(qty))));
  }, []);

  const value = useMemo(
    () => ({ colorId, quantity, setColor, setQuantity }),
    [colorId, quantity, setColor, setQuantity],
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProduct(): ProductState {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProduct must be used inside <ProductProvider>");
  return ctx;
}
