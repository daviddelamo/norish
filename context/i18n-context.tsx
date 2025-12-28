"use client";

import type { ReactNode } from "react";
import type { Language } from "@/server/db/zodSchemas/user";

import { createContext, useContext, useMemo, useCallback, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { getTranslation, formatNumber, formatQuantity, type TranslationPath } from "@/lib/i18n";
import { useTRPC } from "@/app/providers/trpc-provider";

type I18nContextType = {
    language: Language;
    setLanguage: (language: Language) => Promise<void>;
    t: (path: TranslationPath) => string;
    formatNumber: (value: number, decimals?: number) => string;
    formatQuantity: (value: number | null | undefined) => string;
    isLoading: boolean;
};

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
    children: ReactNode;
    initialLanguage?: Language;
}

export function I18nProvider({ children, initialLanguage = "en" }: I18nProviderProps) {
    const [language, setLanguageState] = useState<Language>(initialLanguage);
    const [isLoading, setIsLoading] = useState(false);

    const trpc = useTRPC();
    const updateLanguageMutation = useMutation(trpc.user.updateLanguage.mutationOptions());

    // Sync language from user data when available
    const { data: userData } = useQuery(trpc.user.get.queryOptions());

    useEffect(() => {
        if (userData?.user?.language) {
            setLanguageState(userData.user.language);
        }
    }, [userData?.user?.language]);

    const setLanguage = useCallback(
        async (newLanguage: Language) => {
            setIsLoading(true);
            try {
                await updateLanguageMutation.mutateAsync({ language: newLanguage });
                setLanguageState(newLanguage);
            } finally {
                setIsLoading(false);
            }
        },
        [updateLanguageMutation]
    );

    const t = useCallback(
        (path: TranslationPath): string => getTranslation(language, path),
        [language]
    );

    const formatNum = useCallback(
        (value: number, decimals?: number): string => formatNumber(value, language, decimals),
        [language]
    );

    const formatQty = useCallback(
        (value: number | null | undefined): string => formatQuantity(value, language),
        [language]
    );

    const value = useMemo(
        () => ({
            language,
            setLanguage,
            t,
            formatNumber: formatNum,
            formatQuantity: formatQty,
            isLoading,
        }),
        [language, setLanguage, t, formatNum, formatQty, isLoading]
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
    const { t, language } = useI18n();
    return { t, language };
}

export function useFormatNumber() {
    const { formatNumber, formatQuantity, language } = useI18n();
    return { formatNumber, formatQuantity, language };
}
