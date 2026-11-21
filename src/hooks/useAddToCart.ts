import { toast } from "sonner";

import { displayName, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

/** Adds the first available variant of a product to the Shopify cart and opens the drawer. */
export function useAddToCart() {
  const addItem = useCartStore((s) => s.addItem);
  const setOpen = useCartStore((s) => s.setOpen);
  const isLoading = useCartStore((s) => s.isLoading);

  const add = async (product: ShopifyProduct, quantity = 1) => {
    const variant =
      product.node.variants.edges.find((v) => v.node.availableForSale)?.node ??
      product.node.variants.edges[0]?.node;
    if (!variant) return;
    const result = await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity,
      selectedOptions: variant.selectedOptions || [],
    });
    if (result === "added") {
      toast.success("Agregado a tu pedido", { description: displayName(product), position: "top-center" });
      setOpen(true);
    } else if (result === "out_of_stock") {
      toast.error("Producto sin existencias por ahora", {
        description: "Escríbenos por WhatsApp y te confirmamos disponibilidad.",
        position: "top-center",
      });
    } else {
      toast.error("No pudimos agregar el producto", { description: "Intenta de nuevo en un momento.", position: "top-center" });
    }
  };

  return { add, isLoading };
}
