import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock_quantity: number;
    model?: string;
    brand_id?: string;
    brands?: {
      id: string;
      name: string;
    };
  };
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Customer {
  id: string;
  customer_id: string;
  name: string;
  company_name?: string;
  email: string;
  phone?: string;
  mobile?: string;
  tier: string;
  health_score: number;
  churn_risk: string;
  upsell_potential: string;
  lifetime_value: number;
  outstanding_balance: number;
  preferred_payment?: string;
  status: string;
  total_orders: number;
  last_order_date?: string;
  tags: string[];
}

// Helper functions to identify demo data
const isDemoProduct = (product: CartItem['product']): boolean => {
  const demoPatterns = [
    /^inch\s+\d+$/i,  // "inch 32", "INCH 43", etc.
    /^test/i,         // "test product", etc.
    /^demo/i,         // "demo product", etc.
    /^sample/i,       // "sample product", etc.
    /^custom integration$/i,  // The hardcoded demo items
    /^training package$/i,    // The hardcoded demo items
  ];
  
  return demoPatterns.some(pattern => pattern.test(product.name));
};

const isDemoCustomer = (customer: Customer): boolean => {
  const demoPatterns = [
    /^demo/i,
    /^test/i,
    /^sample/i,
  ];
  
  return demoPatterns.some(pattern => 
    pattern.test(customer.name) || 
    (customer.company_name && pattern.test(customer.company_name))
  );
};

interface SalesHubState {
  // Cart state
  cart: CartItem[];
  selectedCustomer: Customer | null;
  discount: number;
  showOrderSummary: boolean;

  // Actions
  setCart: (cart: CartItem[]) => void;
  addToCart: (item: CartItem) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  setSelectedCustomer: (customer: Customer | null) => void;
  setDiscount: (discount: number) => void;
  setShowOrderSummary: (show: boolean) => void;

  // Computed values
  getCartTotal: () => number;
  getCartSubtotal: () => number;
  getCartItemCount: () => number;

  // Reset function for when user wants to start fresh
  resetSalesHub: () => void;
  
  // Clear demo data from localStorage
  clearDemoData: () => void;
}

const initialState = {
  cart: [],
  selectedCustomer: null,
  discount: 0,
  showOrderSummary: false,
};

export const useSalesHubStore = createWithEqualityFn<SalesHubState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCart: (cart) => set({ cart }),

      addToCart: (item) => {
        const currentCart = get().cart;
        const existingItem = currentCart.find(cartItem =>
          cartItem.product.id === item.product.id
        );

        if (existingItem) {
          // Update quantity if item already exists
          const updatedCart = currentCart.map(cartItem =>
            cartItem.product.id === item.product.id
              ? {
                  ...cartItem,
                  quantity: cartItem.quantity + item.quantity,
                  subtotal: (cartItem.quantity + item.quantity) * cartItem.price
                }
              : cartItem
          );
          set({ cart: updatedCart });
        } else {
          // Add new item
          set({ cart: [...currentCart, item] });
        }
      },

      updateCartItem: (productId, updates) => {
        const currentCart = get().cart;
        const updatedCart = currentCart.map(item => {
          if (item.product.id === productId) {
            const updatedItem = { ...item, ...updates };
            // Recalculate subtotal if quantity or price changed
            if (updates.quantity !== undefined || updates.price !== undefined) {
              updatedItem.subtotal = (updates.quantity ?? item.quantity) * (updates.price ?? item.price);
            }
            return updatedItem;
          }
          return item;
        });
        set({ cart: updatedCart });
      },

      removeFromCart: (productId) => {
        const currentCart = get().cart;
        const updatedCart = currentCart.filter(item => item.product.id !== productId);
        set({ cart: updatedCart });
      },

      clearCart: () => set({ cart: [] }),

      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

      setDiscount: (discount) => set({ discount }),

      setShowOrderSummary: (show) => set({ showOrderSummary: show }),

      getCartTotal: () => {
        const { cart, discount } = get();
        const subtotal = cart.reduce((total, item) => total + item.subtotal, 0);
        return Math.max(0, subtotal - discount);
      },

      getCartSubtotal: () => {
        const { cart } = get();
        return cart.reduce((total, item) => {
          const subtotal = item.subtotal || 0;
          return total + (isNaN(subtotal) ? 0 : subtotal);
        }, 0);
      },

      getCartItemCount: () => {
        const { cart } = get();
        return cart.reduce((total, item) => {
          const quantity = item.quantity || 0;
          return total + (isNaN(quantity) ? 0 : quantity);
        }, 0);
      },

      resetSalesHub: () => set(initialState),
      
      clearDemoData: () => {
        const currentState = get();
        const cleanedCart = currentState.cart.filter(item => !isDemoProduct(item.product));
        const cleanedCustomer = currentState.selectedCustomer && !isDemoCustomer(currentState.selectedCustomer) 
          ? currentState.selectedCustomer 
          : null;
        
        set({
          cart: cleanedCart,
          selectedCustomer: cleanedCustomer,
        });
      },
    }),
    {
      name: 'sales-hub-storage', // Key for localStorage
      partialize: (state) => ({
        cart: state.cart,
        selectedCustomer: state.selectedCustomer,
        discount: state.discount,
        showOrderSummary: state.showOrderSummary,
      }),
      // Clean up invalid cart items when loading from storage (removed automatic demo data clearing)
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Filter out cart items with invalid products only (keep all valid products)
          state.cart = state.cart.filter(item =>
            item &&
            item.product &&
            typeof item.product === 'object' &&
            item.product.id &&
            item.product.name &&
            typeof item.quantity === 'number' &&
            typeof item.price === 'number'
          );

          // Keep selected customer (don't auto-clear)
          // Customer clearing should only happen when explicitly requested
        }
      },
    }
  )
);