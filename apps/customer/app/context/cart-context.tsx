'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

export interface CartItem {
  id: string; // Unique key: `${productId}:${variantId || 'default'}`
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName?: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string;
  isPreorder?: boolean;
  preorderMessage?: string | null;
  color?: string | null;
  colorHex?: string | null;
  size?: string | null;
}

interface CartContextType {
  items: CartItem[];
  totalCount: number;
  subtotal: number;
  isOpen: boolean;
  isHydrated: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'dissafyt_cart';
const EVENT_KEY = 'dissafyt_cart_updated';

function normalizeItem(raw: any): CartItem | null {
  if (!raw || !raw.productId) return null;
  const variantId = raw.variantId || null;
  const id = raw.id || `${raw.productId}:${variantId || 'default'}`;
  return {
    id,
    productId: String(raw.productId),
    variantId: variantId ? String(variantId) : null,
    productName: raw.productName || raw.name || 'Dissafyt Garment',
    variantName: raw.variantName || raw.size || 'Standard',
    price: Number(raw.price) || 0,
    quantity: Math.max(1, Number(raw.quantity) || 1),
    image: raw.image || '',
    slug: raw.slug || '',
    isPreorder: Boolean(raw.isPreorder || raw.is_preorder),
    preorderMessage: raw.preorderMessage || raw.preorder_message || null,
    color: raw.color || null,
    colorHex: raw.colorHex || raw.color_hex || null,
    size: raw.size || null,
  };
}

function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeItem).filter((item): item is CartItem => Boolean(item));
  } catch (err) {
    console.warn('[CartContext] Failed to parse stored cart:', err);
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent(EVENT_KEY));
  } catch (err) {
    console.error('[CartContext] Failed to persist cart:', err);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from localStorage on mount (hydration safety)
  useEffect(() => {
    const stored = getStoredCart();
    setItems(stored);
    setIsHydrated(true);

    const handleSync = () => {
      setItems(getStoredCart());
    };

    window.addEventListener(EVENT_KEY, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(EVENT_KEY, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const addItem = useCallback((itemData: Omit<CartItem, 'id'>) => {
    const variantId = itemData.variantId || null;
    const computedId = `${itemData.productId}:${variantId || 'default'}`;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === computedId);
      let updated: CartItem[];

      if (existingIdx > -1) {
        updated = [...prev];
        const current = updated[existingIdx];
        updated[existingIdx] = {
          ...current,
          quantity: current.quantity + (itemData.quantity || 1),
          price: itemData.price, // update to latest price
          image: itemData.image || current.image,
          slug: itemData.slug || current.slug,
          variantName: itemData.variantName || current.variantName,
        };
      } else {
        const newItem: CartItem = {
          ...itemData,
          id: computedId,
          variantId,
          quantity: Math.max(1, itemData.quantity || 1),
        };
        updated = [...prev, newItem];
      }

      saveCart(updated);
      return updated;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveCart(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        const updated = prev.filter((i) => i.id !== id);
        saveCart(updated);
        return updated;
      }
      const updated = prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      saveCart(updated);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(EVENT_KEY));
      } catch (err) {
        console.error('[CartContext] Failed to clear cart:', err);
      }
    }
  }, []);

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const contextValue = useMemo<CartContextType>(() => ({
    items,
    totalCount,
    subtotal,
    isOpen,
    isHydrated,
    openCart,
    closeCart,
    toggleCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }), [
    items,
    totalCount,
    subtotal,
    isOpen,
    isHydrated,
    openCart,
    closeCart,
    toggleCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
