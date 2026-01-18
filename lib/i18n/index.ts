import type { Locale } from "@/server/db/zodSchemas/user";

import en from "./translations/en.json";
import es from "./translations/es.json";

export type TranslationKeys = typeof en;
export type TranslationPath = string;

const translations: Record<Locale, TranslationKeys> = {
    en,
    es,
};

/**
 * Get a nested translation value by dot-notation path
 * @example getTranslation("en", "common.save") => "Save"
 */
export function getTranslation(locale: Locale, path: TranslationPath): string {
    // Default to 'en' if locale is null/undefined or not supported
    const effectiveLocale = (locale && translations[locale]) ? locale : "en";
    const keys = path.split(".");
    let value: any = translations[effectiveLocale];

    for (const key of keys) {
        if (value === undefined || value === null) {
            return path; // Return the path as fallback
        }
        value = value[key];
    }

    return typeof value === "string" ? value : path;
}

/**
 * Create a translator function bound to a specific locale
 */
export function createTranslator(locale: Locale) {
    return (path: TranslationPath): string => getTranslation(locale, path);
}

/**
 * Format a number according to locale
 * Spanish uses comma as decimal separator: 1.234,56
 * English uses period as decimal separator: 1,234.56
 */
export function formatNumber(value: number, locale: Locale, decimals?: number): string {
    const localeCode = locale === "es" ? "es-ES" : "en-US";

    return new Intl.NumberFormat(localeCode, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals ?? 2,
    }).format(value);
}

/**
 * Format a quantity for display (e.g., ingredient amounts)
 * Removes unnecessary decimal places for whole numbers
 */
export function formatQuantity(value: number | null | undefined, locale: Locale): string {
    if (value === null || value === undefined) {
        return "";
    }

    // If it's a whole number, don't show decimals
    if (Number.isInteger(value)) {
        return formatNumber(value, locale, 0);
    }

    // Otherwise show up to 2 decimal places
    return formatNumber(value, locale);
}

export { type Locale };
