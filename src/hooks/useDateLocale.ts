import { useMemo } from "react";
import { pl, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * The date-fns locale matching the chosen language.
 *
 * Seven files each derived this with their own ternary, which is seven places
 * to update when a third language arrives and seven chances to miss one.
 */
export function useDateLocale() {
    const { lang } = useLanguage();
    return useMemo(() => (lang === "pl" ? pl : enUS), [lang]);
}
