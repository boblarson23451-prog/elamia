"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const refreshUser = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setUser(data.user || null);
    return data.user || null;
  }, []);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser().then(() => refreshCart());
  }, [refreshUser, refreshCart]);

  const addToCart = async (productId, quantity = 1, variantId = null) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, variantId }),
    });
    if (res.status === 401) return { ok: false, needsAuth: true };
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error };
    }
    await refreshCart();
    return { ok: true };
  };

  const updateQuantity = async (itemId, quantity) => {
    await fetch(`/api/cart/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    await refreshCart();
  };

  const removeItem = async (itemId) => {
    await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
    await refreshCart();
  };

  const clearAfterOrder = () => setItems([]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  return (
    <CartContext.Provider
      value={{ items, loading, count, subtotal, addToCart, updateQuantity, removeItem, refreshCart, clearAfterOrder, user, refreshUser, setUser }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
