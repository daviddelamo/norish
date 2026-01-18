"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/server/db/zodSchemas/user";

import { createContext, useContext, useMemo, useCallback, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { getTranslation, formatNumber, formatQuantity, type TranslationPath } from "@/lib/i18n";
import { useTRPC } from "@/app/providers/trpc-provider";

type I18nContextType = {
    locale: Locale;
    setLocale: (locale: Locale) => Promise<void>;
    t: (path: TranslationPath) => string;
    formatNumber: (value: number, decimals?: number) => string;
    formatQuantity: (value: number | null | undefined) => string;
    isLoading: boolean;
};

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
    children: ReactNode;
    initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = "en" }: I18nProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale);
    const [isLoading, setIsLoading] = useState(false);

    const trpc = useTRPC();
    const updateLocaleMutation = useMutation(trpc.user.setLocale.mutationOptions());

    // Sync language from user data when available
    const { data: userData } = useQuery(trpc.user.get.queryOptions());

    useEffect(() => {
        // Cast to Locale if valid, otherwise ignore
        const userLocale = userData?.user?.locale as Locale | undefined;
        if (userLocale && (userLocale === "en" || userLocale === "es")) {
            setLocaleState(userLocale);
        }
    }, [userData?.user?.locale]);

    const setLocale = useCallback(
        async (newLocale: Locale) => {
            setIsLoading(true);
            try {
                await updateLocaleMutation.mutateAsync({ locale: newLocale });
                setLocaleState(newLocale);
            } finally {
                setIsLoading(false);
            }
        },
        [updateLocaleMutation]
    );

    const t = useCallback(
        (path: TranslationPath): string => getTranslation(locale, path),
        [locale]
    );

    const formatNum = useCallback(
        (value: number, decimals?: number): string => formatNumber(value, locale, decimals),
        [locale]
    );

    const formatQty = useCallback(
        (value: number | null | undefined): string => formatQuantity(value, locale),
        [locale]
    );

    const value = useMemo(
        () => ({
            locale,
            setLocale,
            t,
            formatNumber: formatNum,
            formatQuantity: formatQty,
            isLoading,
        }),
        [locale, setLocale, t, formatNum, formatQty, isLoading]
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    const context = useContext(I18nContext);

    if (!context) {
        throw new Error("useI18n must be used within I18nProvider");
    }

    return context;
}

// Convenience hooks
export function useTranslation() {
    const { t, locale } = useI18n();
    return { t, locale };
}

export function useFormatNumber() {
    const { formatNumber, formatQuantity, locale } = useI18n();
    return { formatNumber, formatQuantity, locale };
}
