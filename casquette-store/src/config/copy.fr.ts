/**
 * Every user-facing string lives here, behind the t() helper.
 * To add a second language later, duplicate this file (copy.ar.ts, …)
 * and switch the imported dictionary — components never hardcode text.
 *
 * NOTE: the vendored font subset is latin-only; avoid the 'œ' ligature
 * (write "oe") — see DECISIONS.md.
 */
const copy = {
  seo: {
    /** {product} and {store} are interpolated from site.config.ts */
    title: "{product} — Livraison partout en Algérie | {store}",
    ogTitle: "{product} — Livraison partout en Algérie",
    /** Under 155 chars. */
    description:
      "{product} — coton peigné, taille ajustable. Livraison gratuite dans les 58 wilayas, paiement à la livraison. Commandez en 1 minute.",
    descriptionPaidShipping:
      "{product} — coton peigné, taille ajustable. Paiement à la livraison dans les 58 wilayas. Commandez en 1 minute.",
  },
  common: {
    orderCta: "Commander maintenant",
    close: "Fermer",
    copy: "Copier",
    copied: "Numéro copié",
    retry: "Réessayer",
    seeAll: "Tout voir",
    backToTop: "Retour en haut",
    loading: "Chargement…",
  },
  header: {
    // Store name is rendered from config; nothing else in the header.
  },
  hero: {
    eyebrow: "Livraison partout en Algérie",
    discountPill: "-{percent}%",
    colorLabel: "Couleur",
    trust1: "Paiement à la livraison",
    trust2: "Retour sous 7 jours",
    trust3: "Produit vérifié avant envoi",
    /** Shown only while pricing.freeShipping is true */
    trustFreeShipping: "Livraison gratuite partout en Algérie",
  },
  gallery: {
    title: "La casquette en détail",
    eyebrow: "Galerie",
    carouselLabel: "Photos du produit",
    slideLabel: "{n} de {m}",
    zoomHint: "Toucher pour agrandir",
    zoomLabel: "Image agrandie — {alt}",
    zoomClose: "Fermer le zoom",
    prevSlide: "Photo précédente",
    nextSlide: "Photo suivante",
  },
  whyBuy: {
    eyebrow: "L'essentiel",
    title: "Une casquette que vous garderez longtemps",
    p1: "La coupe est ajustée sans être serrée : la visière garde sa forme, la couronne épouse la tête, et la sangle arrière se règle en deux secondes.",
    p2: "Le coton peigné est doux au toucher et respire bien. Elle se porte en plein été sans transpirer, et le tissu tient sa couleur lavage après lavage.",
    p3: "C'est la pièce qu'on attrape tous les matins : elle va avec un survêtement comme avec une chemise, et elle finit toutes les tenues proprement.",
  },
  reviews: {
    eyebrow: "Ils l'ont adoptée",
    title: "Avis de nos clients",
    summary: "{rating}/5 · {count} avis",
    verified: "Achat vérifié",
    ratingLabel: "Note : {rating} sur 5",
  },
  order: {
    eyebrow: "Commande",
    title: "Commandez maintenant",
    subtitle: "Remplissez le formulaire — nous vous appelons pour confirmer.",
    fields: {
      name: {
        label: "Nom complet",
        placeholder: "Votre nom et prénom",
      },
      phone: {
        label: "Numéro de téléphone",
        placeholder: "05 / 06 / 07…",
      },
      wilaya: {
        label: "Wilaya",
        placeholder: "Choisissez votre wilaya",
      },
      commune: {
        label: "Commune",
        placeholder: "Choisissez votre commune",
        placeholderDisabled: "Choisissez d'abord une wilaya",
      },
      color: { label: "Couleur" },
      quantity: {
        label: "Quantité",
        decrease: "Diminuer la quantité",
        increase: "Augmenter la quantité",
      },
      delivery: {
        label: "Type de livraison",
        unavailable: "Non disponible dans cette wilaya",
      },
    },
    errors: {
      nameRequired: "Entrez votre nom complet",
      nameLength: "Le nom doit contenir entre {min} et {max} caractères",
      nameFormat: "Le nom ne peut contenir que des lettres",
      phoneRequired: "Entrez votre numéro de téléphone",
      phoneInvalid: "Entrez un numéro mobile valide (05, 06 ou 07)",
      wilayaRequired: "Choisissez votre wilaya",
      communeRequired: "Choisissez votre commune",
      formErrors: "{count} champ(s) à corriger",
    },
    summary: {
      title: "Récapitulatif",
      product: "Prix du produit",
      productQty: "Prix du produit × {qty}",
      shipping: "Livraison",
      shippingPending: "—",
      total: "Total",
      free: "Gratuite",
    },
    submitLabel: "Commander maintenant — {total}",
    submitting: "Envoi en cours…",
    reassurance: "Paiement à la livraison. Aucun paiement en ligne.",
    /** Appended to the reassurance line while pricing.freeShipping is true */
    reassuranceFreeShipping:
      "Livraison gratuite partout en Algérie. Paiement à la livraison, aucun paiement en ligne.",
    success: {
      title: "Commande reçue",
      body: "Nous vous appellerons dans les 24 heures pour confirmer votre commande.",
      orderIdLabel: "Numéro de commande",
    },
    error: {
      title: "Échec de l'envoi",
      body: "Votre commande n'a pas pu être envoyée. Réessayez, ou commandez par WhatsApp.",
      whatsappCta: "Commander par WhatsApp",
    },
    queued: {
      sent: "Votre commande en attente a bien été envoyée",
    },
  },
  sticky: {
    priceLabel: "Prix total produit",
  },
  whatsapp: {
    label: "Nous écrire sur WhatsApp",
    prefill: "Bonjour, je souhaite commander : {product}",
    prefillOrder:
      "Bonjour, je souhaite commander : {product} — Couleur {color}, quantité {qty}, wilaya {wilaya}. Commande {orderId}.",
  },
  footer: {
    deliveryNote: "Livraison dans les 58 wilayas, paiement à la réception.",
    rights: "© {year} {store}. Tous droits réservés.",
  },
} as const;

type Dict = { readonly [k: string]: string | Dict };
type DotPaths<T extends Dict> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends Dict
      ? `${K}.${DotPaths<T[K]>}`
      : never;
}[keyof T & string];

export type CopyKey = DotPaths<typeof copy>;

/** Resolve a copy key, interpolating {placeholders} from vars. */
export function t(
  key: CopyKey,
  vars?: Record<string, string | number>,
): string {
  const raw = key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], copy);
  if (typeof raw !== "string") return key;
  return vars
    ? raw.replace(/\{(\w+)\}/g, (m, name: string) =>
        name in vars ? String(vars[name]) : m,
      )
    : raw;
}
