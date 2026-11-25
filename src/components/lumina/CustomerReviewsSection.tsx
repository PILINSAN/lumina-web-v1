import { Star, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { cn } from "@/lib/utils";

interface ReviewItem {
  id: string;
  author: string;
  city: string;
  product: string;
  rating: number;
  comment: string;
  createdAt: string;
  isCustom?: boolean;
}

const STORAGE_KEY = "lumina_customer_reviews_v1";

const SEED_REVIEWS: ReviewItem[] = [
  {
    id: "seed-1",
    author: "Camila Herrera",
    city: "Bogotá",
    product: "Glucora Sugar Control",
    rating: 5,
    comment:
      "Me gustó mucho el formato en gotas porque es fácil de medir y agregar a la rutina diaria. El envío llegó rápido y pagué al recibir.",
    createdAt: "Hace 4 días",
  },
  {
    id: "seed-2",
    author: "Andrés Restrepo",
    city: "Medellín",
    product: "German Plus Suero Antihongo",
    rating: 5,
    comment:
      "Textura ligera y fácil de aplicar todos los días. Llevo unas semanas usándolo y la uña se ve más cuidada.",
    createdAt: "Hace 1 semana",
  },
  {
    id: "seed-3",
    author: "Valentina Ortiz",
    city: "Cali",
    product: "Dr. Melaxin PEEL SHOT",
    rating: 4,
    comment:
      "El atomizador es muy práctico para aplicar en rodillas y codos. Se siente suave en la piel y sin sensación pegajosa.",
    createdAt: "Hace 2 semanas",
  },
];

const PRODUCT_OPTIONS = [
  "Glucora Sugar Control",
  "German Plus Suero Antihongo",
  "Nature's Sunshine Drenaje Linfático",
  "Lymphatic Drainage®",
  "Dr. Melaxin PEEL SHOT",
];

function StarRating({
  value,
  onChange,
  interactive = false,
}: {
  value: number;
  onChange?: (next: number) => void;
  interactive?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" aria-label={`Calificación de ${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        if (!interactive) {
          return (
            <Star
              key={star}
              className={cn(
                "h-4 w-4",
                filled ? "fill-amber-400 text-amber-400" : "text-stone-300",
              )}
            />
          );
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            aria-label={`Seleccionar ${star} ${star === 1 ? "estrella" : "estrellas"}`}
            className="rounded p-0.5 transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#182b35]"
          >
            <Star
              className={cn(
                "h-5 w-5",
                filled ? "fill-amber-400 text-amber-400" : "text-stone-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function CustomerReviewsSection() {
  const [customReviews, setCustomReviews] = useState<ReviewItem[]>([]);
  const [author, setAuthor] = useState("");
  const [city, setCity] = useState("");
  const [product, setProduct] = useState(PRODUCT_OPTIONS[0]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCustomReviews(parsed);
      }
    } catch {
      // Ignorar errores de acceso a localStorage
    }
  }, []);

  const persistCustomReviews = (next: ReviewItem[]) => {
    setCustomReviews(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignorar errores de escritura en localStorage
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanAuthor = author.trim();
    const cleanComment = comment.trim();

    if (!cleanAuthor || !cleanComment) {
      setErrorMsg("Escribe tu nombre y tu reseña antes de publicar.");
      return;
    }

    const newReview: ReviewItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: cleanAuthor,
      city: city.trim() || "Colombia",
      product,
      rating,
      comment: cleanComment,
      createdAt: "Publicado hoy",
      isCustom: true,
    };

    const updated = [newReview, ...customReviews];
    persistCustomReviews(updated);
    setAuthor("");
    setCity("");
    setRating(5);
    setComment("");
    setErrorMsg("");
  };

  const handleDeleteCustom = (id: string) => {
    const updated = customReviews.filter((item) => item.id !== id);
    persistCustomReviews(updated);
  };

  const allReviews = [...customReviews, ...SEED_REVIEWS];

  return (
    <section
      id="resenas"
      aria-labelledby="resenas-heading"
      className="border-t border-stone-200/80 bg-[#faf8f5] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-stone-500 uppercase">
              Experiencias de clientes
            </p>
            <h2
              id="resenas-heading"
              className="font-display mt-2 text-3xl text-[#182b35] sm:text-4xl"
            >
              Reseñas de la comunidad LUMINA
            </h2>
          </div>
          <p className="max-w-md text-sm text-stone-600">
            Consulta opiniones sobre nuestros productos o deja la tuya para que quede guardada en
            este navegador.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Formulario para escribir y guardar una reseña */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs"
            >
              <h3 className="font-display text-xl text-[#182b35]">Escribe tu reseña</h3>
              <p className="mt-1 text-xs text-stone-500">
                Se guardará automáticamente al enviarla.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="review-author"
                    className="block text-xs font-medium tracking-wide text-stone-700 uppercase"
                  >
                    Nombre
                  </label>
                  <input
                    id="review-author"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Tu nombre"
                    className="mt-1.5 w-full rounded-xl border border-stone-300 bg-[#faf8f5] px-3.5 py-2.5 text-sm text-[#182b35] focus:border-[#182b35] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="review-city"
                      className="block text-xs font-medium tracking-wide text-stone-700 uppercase"
                    >
                      Ciudad
                    </label>
                    <input
                      id="review-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej. Bogotá"
                      className="mt-1.5 w-full rounded-xl border border-stone-300 bg-[#faf8f5] px-3.5 py-2.5 text-sm text-[#182b35] focus:border-[#182b35] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="review-product"
                      className="block text-xs font-medium tracking-wide text-stone-700 uppercase"
                    >
                      Producto
                    </label>
                    <select
                      id="review-product"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-stone-300 bg-[#faf8f5] px-3 py-2.5 text-sm text-[#182b35] focus:border-[#182b35] focus:bg-white focus:outline-none"
                    >
                      {PRODUCT_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium tracking-wide text-stone-700 uppercase">
                    Calificación
                  </span>
                  <div className="mt-1.5">
                    <StarRating value={rating} onChange={setRating} interactive />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="review-comment"
                    className="block text-xs font-medium tracking-wide text-stone-700 uppercase"
                  >
                    Comentario
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Cuéntanos cómo te ha parecido el producto y el servicio..."
                    className="mt-1.5 w-full rounded-xl border border-stone-300 bg-[#faf8f5] px-3.5 py-2.5 text-sm text-[#182b35] focus:border-[#182b35] focus:bg-white focus:outline-none"
                  />
                </div>

                {errorMsg && <p className="text-xs font-medium text-red-600">{errorMsg}</p>}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#182b35] px-4 py-3 text-sm font-medium text-[#faf6f9] transition-colors duration-150 hover:bg-[#223b48] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#182b35]"
                >
                  Publicar reseña
                </button>
              </div>
            </form>
          </div>

          {/* Listado de reseñas */}
          <div className="space-y-4 lg:col-span-7">
            {allReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-2xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[#182b35]">{review.author}</h4>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs text-stone-500">{review.city}</span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-stone-600">{review.product}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StarRating value={review.rating} />
                    {review.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom(review.id)}
                        aria-label={`Eliminar reseña de ${review.author}`}
                        className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-stone-700">{review.comment}</p>
                <p className="mt-3 text-[11px] text-stone-400">{review.createdAt}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}