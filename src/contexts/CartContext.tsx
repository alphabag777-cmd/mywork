import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { InvestmentPlan } from "@/lib/plans";

interface CartItem {
  plan: InvestmentPlan;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (plan: InvestmentPlan) => void;
  removeFromCart: (planId: string) => void;
  updateQuantity: (planId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalAmount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "alphabag_cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse cart:", e);
        return [];
      }
    }
    return [];
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const addToCart = (plan: InvestmentPlan) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.plan.id === plan.id);
      if (existingItem) {
        // If already in cart, increase quantity
        return prevItems.map((item) =>
          item.plan.id === plan.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item to cart
        return [...prevItems, { plan, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (planId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.plan.id !== planId));
  };

  const updateQuantity = (planId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(planId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.plan.id === planId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    // For now, return 0 as investment amount is handled separately
    // This can be used for calculating total if plans have prices
    return 0;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

