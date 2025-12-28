import type { Language } from "@/server/db/zodSchemas/user";

import en from "./translations/en.json";
import es from "./translations/es.json";

export type TranslationKeys = typeof en;
export type TranslationPath = string;

const translations: Record<Language, TranslationKeys> = {
    en,
    es,
};

/**
 * Get a nested translation value by dot-notation path
 * @example getTranslation("en", "common.save") => "Save"
 */
export function getTranslation(language: Language, path: TranslationPath): string {
    const keys = path.split(".");
    let value: any = translations[language];

    for (const key of keys) {
        if (value === undefined || value === null) {
            return path; // Return the path as fallback
        }
        value = value[key];
    }

    return typeof value === "string" ? value : path;
}

/**
 * Create a translator function bound to a specific language
 */
export function createTranslator(language: Language) {
    return (path: TranslationPath): string => getTranslation(language, path);
}

/**
 * Format a number according to locale
 * Spanish uses comma as decimal separator: 1.234,56
 * English uses period as decimal separator: 1,234.56
 */
export function formatNumber(value: number, language: Language, decimals?: number): string {
    const locale = language === "es" ? "es-ES" : "en-US";

    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals ?? 2,
    }).format(value);
}

/**
 * Format a quantity for display (e.g., ingredient amounts)
 * Removes unnecessary decimal places for whole numbers
 */
export function formatQuantity(value: number | null | undefined, language: Language): string {
    if (value === null || value === undefined) {
        return "";
    }

    // If it's a whole number, don't show decimals
    if (Number.isInteger(value)) {
        return formatNumber(value, language, 0);
    }

    // Otherwise show up to 2 decimal places
    return formatNumber(value, language);
}

export { type Language };
