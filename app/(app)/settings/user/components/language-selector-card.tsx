"use client";

import type { Selection } from "@heroui/react";

import { Card, CardBody, CardHeader, Select, SelectItem } from "@heroui/react";

import { useI18n } from "@/context/i18n-context";

const languages = [
    { key: "en", label: "English" },
    { key: "es", label: "Español" },
] as const;

export default function LanguageSelectorCard() {
    const { language, setLanguage, t, isLoading } = useI18n();

    const handleLanguageChange = async (keys: Selection) => {
        if (keys === "all" || keys.size === 0) return;
        const selectedKey = Array.from(keys)[0] as "en" | "es";
        if (selectedKey && selectedKey !== language) {
            await setLanguage(selectedKey);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-col items-start gap-1">
                <h3 className="text-lg font-semibold">{t("settings.user.language")}</h3>
                <p className="text-default-500 text-sm">{t("settings.user.languageDescription")}</p>
            </CardHeader>
            <CardBody>
                <Select
                    aria-label={t("settings.user.language")}
                    className="max-w-xs"
                    isDisabled={isLoading}
                    selectedKeys={new Set([language])}
                    onSelectionChange={handleLanguageChange}
                >
                    {languages.map((lang) => (
                        <SelectItem key={lang.key}>{lang.label}</SelectItem>
                    ))}
                </Select>
            </CardBody>
        </Card>
    );
}
