import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types/cart.types';
import { Producto } from '../types/producto.types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (producto: Producto, cantidad?: number) => void;
  removeFromCart: (productoId: number) => void;
  updateQuantity: (productoId: number, cantidad: number) => void;
  clearCart: () => void;
  totalArticulos: number;
  subtotal: number;
  impuesto: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'appresso_cart_v1';
const IVA_RATE = 0.19; // IVA 19% concordante con BackEnd

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (producto: Producto, cantidad: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.producto.id === producto.id);
      if (existing) {
        const newQty = Math.min(existing.cantidad + cantidad, producto.stock);
        return prev.map((item) =>
          item.producto.id === producto.id ? { ...item, cantidad: newQty } : item
        );
      }
      return [...prev, { producto, cantidad: Math.min(cantidad, producto.stock) }];
    });
  };

  const removeFromCart = (productoId: number) => {
    setCart((prev) => prev.filter((item) => item.producto.id !== productoId));
  };

  const updateQuantity = (productoId: number, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(productoId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.producto.id === productoId) {
          const validQty = Math.min(cantidad, item.producto.stock);
          return { ...item, cantidad: validQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalArticulos = cart.reduce((acc, item) => acc + item.cantidad, 0);

  // Subtotal calculado sobre precios base
  const subtotal = cart.reduce(
    (acc, item) => acc + Number(item.producto.precio) * item.cantidad,
    0
  );

  const impuesto = Math.round(subtotal * IVA_RATE * 100) / 100;
  const total = Math.round((subtotal + impuesto) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalArticulos,
        subtotal,
        impuesto,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
}
