import type { Language } from "@/contexts/LanguageContext";

/**
 * Service and specialty names live in the database, which the seed fills in
 * English. The interface is bilingual, so a Polish page was showing English
 * rows and disagreeing with its own navigation. This maps the catalogue the
 * shop actually stocks onto both languages and falls through to the stored
 * value for anything it does not know, so an admin can still add a service
 * under any name and see it rendered verbatim.
 */
const CATALOG: Record<string, { pl: string; en: string }> = {
    "haircut":              { pl: "Strzyżenie",                 en: "Haircut" },
    "beard trim":           { pl: "Trymowanie brody",           en: "Beard Trim" },
    "haircut + beard":      { pl: "Strzyżenie + broda",         en: "Haircut + Beard" },
    "head shave":           { pl: "Golenie głowy",              en: "Head Shave" },
    "hair wash & style":    { pl: "Mycie i stylizacja",         en: "Hair Wash & Style" },
    "color & highlights":   { pl: "Koloryzacja i pasemka",      en: "Color & Highlights" },
    "fade":                 { pl: "Fade",                       en: "Fade" },
    "classic cuts":         { pl: "Cięcia klasyczne",           en: "Classic cuts" },
    "straight razor shave": { pl: "Golenie brzytwą",            en: "Straight razor shave" },
    "beard styling":        { pl: "Stylizacja brody",           en: "Beard styling" },
    "texturizing":          { pl: "Teksturowanie",              en: "Texturizing" },
};

const DESCRIPTIONS: Record<string, { pl: string; en: string }> = {
    "precise beard shaping and trimming.": {
        pl: "Precyzyjne wymodelowanie i skrócenie brody.",
        en: "Precise beard shaping and trimming.",
    },
    "hair coloring and highlighting by a pro.": {
        pl: "Koloryzacja i pasemka wykonane przez specjalistę.",
        en: "Hair coloring and highlighting by a pro.",
    },
    "modern skin or low fade, perfectly blended.": {
        pl: "Nowoczesny fade — skin albo low, równo wycieniowany.",
        en: "Modern skin or low fade, perfectly blended.",
    },
    "relaxing wash followed by professional styling.": {
        pl: "Relaksujące mycie i profesjonalna stylizacja.",
        en: "Relaxing wash followed by professional styling.",
    },
    "classic haircut tailored to your style.": {
        pl: "Klasyczne strzyżenie dopasowane do Twojego stylu.",
        en: "Classic haircut tailored to your style.",
    },
    "full haircut and beard grooming combo.": {
        pl: "Pełne strzyżenie i pielęgnacja brody w komplecie.",
        en: "Full haircut and beard grooming combo.",
    },
    "clean head shave with hot towel finish.": {
        pl: "Gładkie golenie głowy wykończone gorącym ręcznikiem.",
        en: "Clean head shave with hot towel finish.",
    },
};

const lookup = (
    table: Record<string, { pl: string; en: string }>,
    value: string | null | undefined,
    lang: Language
): string => {
    if (!value) return "";
    const hit = table[value.trim().toLowerCase()];
    return hit ? hit[lang] : value;
};

/** A service or specialty name, in the reader's language. */
export const catalogName = (value: string | null | undefined, lang: Language) =>
    lookup(CATALOG, value, lang);

/** A service description, in the reader's language. */
export const catalogDescription = (value: string | null | undefined, lang: Language) =>
    lookup(DESCRIPTIONS, value, lang);
