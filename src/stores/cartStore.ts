import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  addLineToShopifyCart,
  CART_QUERY,
  createShopifyCart,
  removeLineFromShopifyCart,
  storefrontApiRequest,
  updateShopifyCartLine,
  type Money,
  type ShopifyProduct,
} from "@/lib/shopify";

export type AddResult = "added" | "out_of_stock" | "error";

export interface CartItem {
  lineId: string | null;
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: Money;
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "lineId">) => Promise<AddResult>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      isLoading: false,
      isSyncing: false,
      isOpen: false,
      setOpen: (open) => set({ isOpen: open }),

      addItem: async (item) => {
        if (!useCartStore.persist?.hasHydrated()) await useCartStore.persist?.rehydrate();
        const { items, cartId, clearCart } = get();
        const existingItem = items.find((i) => i.variantId === item.variantId);

        const upsertLocalItem = (lineId: string | null) => {
          const current = get().items;
          const found = current.find((i) => i.variantId === item.variantId);
          if (found) {
            set({
              items: current.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity, lineId: i.lineId ?? lineId }
                  : i,
              ),
            });
          } else {
            set({ items: [...current, { ...item, lineId }] });
          }
        };

        set({ isLoading: true });
        try {
          if (!cartId) {
            const result = await createShopifyCart(item.variantId, item.quantity);
            if (!result || "outOfStock" in result) {
              upsertLocalItem(null);
              return "added";
            }
            set({
              cartId: result.cartId,
              checkoutUrl: result.checkoutUrl,
              items: [{ ...item, lineId: result.lineId }],
            });
            return "added";
          }

          if (existingItem) {
            const newQuantity = existingItem.quantity + item.quantity;
            if (!existingItem.lineId) {
              upsertLocalItem(null);
              return "added";
            }
            const result = await updateShopifyCartLine(cartId, existingItem.lineId, newQuantity);
            if (result.success) {
              set({
                items: get().items.map((i) =>
                  i.variantId === item.variantId ? { ...i, quantity: newQuantity } : i,
                ),
              });
              return "added";
            }
            if (result.cartNotFound) clearCart();
            upsertLocalItem(existingItem.lineId);
            return "added";
          }

          const result = await addLineToShopifyCart(cartId, item.variantId, item.quantity);
          if (result.success) {
            set({ items: [...get().items, { ...item, lineId: result.lineId ?? null }] });
            return "added";
          }
          if (result.cartNotFound) clearCart();
          upsertLocalItem(result.lineId ?? null);
          return "added";
        } catch (error) {
          console.error("Failed to add item:", error);
          upsertLocalItem(null);
          return "added";
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(variantId);
          return;
        }
        const { items, cartId, clearCart } = get();
        const item = items.find((i) => i.variantId === variantId);
        if (!item) return;

        set({
          items: items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
        });

        if (!item.lineId || !cartId) return;

        set({ isLoading: true });
        try {
          const result = await updateShopifyCartLine(cartId, item.lineId, quantity);
          if (result.cartNotFound) {
            clearCart();
          }
        } catch (error) {
          console.error("Failed to update quantity:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId) => {
        const { items, cartId, clearCart } = get();
        const item = items.find((i) => i.variantId === variantId);
        if (!item) return;

        const newItems = items.filter((i) => i.variantId !== variantId);
        if (newItems.length === 0) {
          set({ items: [], cartId: null, checkoutUrl: null });
        } else {
          set({ items: newItems });
        }

        if (!item.lineId || !cartId) return;

        set({ isLoading: true });
        try {
          const result = await removeLineFromShopifyCart(cartId, item.lineId);
          if (result.cartNotFound) {
            clearCart();
          }
        } catch (error) {
          console.error("Failed to remove item:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () => set({ items: [], cartId: null, checkoutUrl: null }),
      getCheckoutUrl: () => get().checkoutUrl,

      syncCart: async () => {
        const { cartId, items, isSyncing, clearCart } = get();
        if (!cartId || isSyncing) return;
        const hasShopifyLines = items.some((i) => Boolean(i.lineId));
        if (!hasShopifyLines) return;

        set({ isSyncing: true });
        try {
          const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
          if (!data) return;
          const cart = data?.data?.cart;
          if (!cart || cart.totalQuantity === 0) clearCart();
        } catch (error) {
          console.error("Failed to sync cart with Shopify:", error);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "shopify-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        items: state.items,
        cartId: state.cartId,
        checkoutUrl: state.checkoutUrl,
      }),
    },
  ),
);