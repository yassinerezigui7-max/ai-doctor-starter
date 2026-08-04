import type { Review } from "@/types";

/**
 * ⚠ PLACEHOLDER REVIEWS — replace with real customer reviews before/after
 * launch. Names are common Algerian first names, texts are generic and
 * plausible; the aggregate shown in the header (4,9/5 · 128 avis) lives in
 * REVIEWS_SUMMARY below.
 */
export const REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Yacine",
    wilaya: "Alger",
    rating: 5,
    body: "Très bonne qualité, le tissu est épais et la broderie est propre. Livrée en 24h sur Alger.",
    verified: true,
  },
  {
    id: "r2",
    name: "Amine",
    wilaya: "Oran",
    rating: 5,
    body: "Conforme aux photos, la taille se règle facilement. Je la porte tous les jours.",
    verified: true,
  },
  {
    id: "r3",
    name: "Lina",
    wilaya: "Sétif",
    rating: 5,
    body: "J'hésitais sur la couleur, finalement le noir va avec tout. Le livreur a appelé avant de passer.",
    verified: true,
  },
  {
    id: "r4",
    name: "Sofiane",
    wilaya: "Constantine",
    rating: 5,
    body: "Deuxième commande, même qualité que la première. Sérieux et rapide.",
    verified: true,
  },
  {
    id: "r5",
    name: "Meriem",
    wilaya: "Blida",
    rating: 5,
    body: "Cadeau pour mon frère, il ne la quitte plus. La visière garde bien sa forme.",
    verified: true,
  },
  {
    id: "r6",
    name: "Walid",
    wilaya: "Tizi Ouzou",
    rating: 5,
    body: "Bon rapport qualité-prix avec la réduction à partir de deux pièces. Paiement à la livraison, aucun souci.",
    verified: true,
  },
];

export const REVIEWS_SUMMARY = { rating: 4.9, count: 128 };
