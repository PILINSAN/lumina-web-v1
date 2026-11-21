import { Banknote, Loader2, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { brand, whatsappLink } from "@/data/brand";
import { formatCOP } from "@/lib/format";
import { displayName } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

export function CartDrawer() {
  const { items, isOpen, setOpen, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } =
    useCartStore();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + parseFloat(i.price.amount) * i.quantity, 0);
  const checkoutUrl = getCheckoutUrl();

  useEffect(() => {
    if (isOpen) syncCart();
  }, [isOpen, syncCart]);

  const handleCheckout = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank");
      setOpen(false);
    }
  };

  const whatsappMessage = [
    `Hola ${brand.name}, quiero hacer este pedido con pago contraentrega:`,
    "",
    ...items.map((i) => {
      const description = i.product.node.description?.trim();
      const shortDesc = description
        ? description.length > 95
          ? `${description.slice(0, 95).trim()}...`
          : description
        : "";
      const variantText =
        i.variantTitle && i.variantTitle.toLowerCase() !== "default title"
          ? ` (${i.variantTitle})`
          : "";
      const unitPrice = formatCOP(i.price.amount);

      return `- ${i.quantity} x ${displayName(i.product)}${variantText} — ${unitPrice}${
        shortDesc ? `\n  Info: ${shortDesc}` : ""
      }`;
    }),
    "",
    `Total: ${formatCOP(totalPrice)} COP`,
    `${brand.shipping} | ${brand.payment}`,
    "",
    "Completa tus datos de envío:",
    "- Nombre completo:",
    "- Ciudad / Departamento:",
    "- Dirección:",
    "- Barrio / Referencia:",
  ].join("\n");

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="glass-strong flex h-full w-full flex-col gap-0 border-l p-0 sm:max-w-md">
        <SheetHeader className="flex-shrink-0 px-7 pb-6 pt-8 text-left">
          <p className="eyebrow text-primary">{brand.name}</p>
          <SheetTitle className="font-display text-5xl font-medium text-foreground">Tu pedido</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {totalItems === 0
              ? "Aún no has agregado productos."
              : `${totalItems} producto${totalItems !== 1 ? "s" : ""} en tu pedido`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-7 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <p className="max-w-[16rem] text-sm text-muted-foreground">
              Explora el catálogo y agrega tus fórmulas favoritas.
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-2 rounded-full border border-border px-6 py-3 text-xs uppercase tracking-[0.2em] text-foreground hover:bg-secondary"
            >
              Ver catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-7">
              <ul className="flex flex-col gap-4">
                {items.map((item) => {
                  const image = item.product.node.images?.edges?.[0]?.node;
                  return (
                    <li key={item.variantId} className="glass flex gap-4 rounded-[1.25rem] p-3">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
                        {image && (
                          <img src={image.url} alt={displayName(item.product)} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display text-xl leading-tight text-foreground">
                            {displayName(item.product)}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            aria-label="Quitar producto"
                            className="text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-primary">{formatCOP(item.price.amount)}</span>
                          <div className="flex items-center gap-1 rounded-full border border-border p-1">
                            <button
                              type="button"
                              aria-label="Restar"
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-secondary"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm">{item.quantity}</span>
                            <button
                              type="button"
                              aria-label="Sumar"
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-secondary"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex-shrink-0 space-y-4 border-t px-7 pb-8 pt-6">
              <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-xs leading-relaxed text-secondary-foreground">
                <Banknote className="h-4 w-4 flex-shrink-0" />
                {brand.payment}. {brand.shipping}.
              </div>
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-muted-foreground">Total</span>
                <span className="font-display text-4xl text-foreground">
                  {formatCOP(totalPrice)}
                  <span className="ml-2 font-sans text-xs tracking-widest text-muted-foreground">COP</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={items.length === 0 || !checkoutUrl || isLoading || isSyncing}
                className="btn-shine flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-sage text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground shadow-lift disabled:opacity-50"
              >
                {isLoading || isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalizar pedido"}
              </button>
              <a
                href={whatsappLink(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-secondary"
              >
                <MessageCircle className="h-4 w-4" />
                Pedir por WhatsApp
              </a>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}