import { createFileRoute } from "@tanstack/react-router";

import { BentoCatalog } from "@/components/lumina/BentoCatalog";
import { Hero } from "@/components/lumina/Hero";
import { OrderSteps } from "@/components/lumina/OrderSteps";
import { productsQueryOptions } from "@/lib/shopify";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  head: () => ({
    meta: [
      { title: "LUMINA | Bienestar y cuidado facial con pago contraentrega" },
      {
        name: "description",
        content:
          "Suplementos de bienestar y cuidado facial con envío a toda Colombia. Pide en línea, confirma por WhatsApp y paga en efectivo al recibir.",
      },
      { property: "og:title", content: "LUMINA | Bienestar y cuidado facial" },
      {
        property: "og:description",
        content: "Envío a toda Colombia y pago en efectivo al recibir.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <BentoCatalog />
      <OrderSteps />
    </>
  );
}
