"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SecretInput from "@/components/shared/secret-input";
import { useAvailableModelsQuery } from "@/hooks/admin";
import { CheckIcon } from "@heroicons/react/16/solid";
import {
  Button,
  ComboBox,
  Description,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import { useTranslations } from "next-intl";

import type { AIConfig, ImageGenerationProvider } from "@norish/config/zod/server-config";
import {
  imageGenerationProviderNeedsEndpoint,
  isCloudImageGenerationProvider,
  ServerConfigKeys,
} from "@norish/config/zod/server-config";

import { useAdminSettingsContext } from "../context";
import ModelListingEmptyState from "./model-listing-empty-state";

interface ImageGenerationFormProps {
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * Only providers whose SDK package exposes an image model are offered
 * (ADR-0024); the rest of the AI provider list cannot be selected here.
 */
const PROVIDER_OPTIONS: ImageGenerationProvider[] = [
  "disabled",
  "openai",
  "google",
  "azure",
  "lm-studio",
  "generic-openai",
];

export default function ImageGenerationForm({ onDirtyChange }: ImageGenerationFormProps) {
  const t = useTranslations("settings.admin.imageGenerationConfig");
  const tActions = useTranslations("common.actions");
  const { imageGenerationConfig, aiConfig, updateImageGenerationConfig, fetchConfigSecret } =
    useAdminSettingsContext();
  const [provider, setProvider] = useState<ImageGenerationProvider>(
    imageGenerationConfig?.provider ?? "disabled"
  );
  const [model, setModel] = useState(imageGenerationConfig?.model ?? "");
  const [endpoint, setEndpoint] = useState(imageGenerationConfig?.endpoint ?? "");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (imageGenerationConfig) {
      setProvider(imageGenerationConfig.provider);
      setModel(imageGenerationConfig.model ?? "");
      setEndpoint(imageGenerationConfig.endpoint ?? "");
    }
  }, [imageGenerationConfig]);

  const enabled = provider !== "disabled";
  const needsEndpoint = enabled && imageGenerationProviderNeedsEndpoint(provider);
  const supportsOptionalEndpoint = provider === "azure";
  const isCloud = enabled && isCloudImageGenerationProvider(provider);
  const showApiKey = isCloud || provider === "generic-openai";
  // Endpoint and key fall back to the AI configuration when the provider
  // matches, so a matching setup needs neither typed again.
  const aiProviderMatches = enabled && aiConfig?.provider === provider;
  const isApiKeyConfigured =
    (!!imageGenerationConfig?.apiKey && imageGenerationConfig.provider === provider) ||
    (aiProviderMatches && !!aiConfig?.apiKey);

  const canFetchModels =
    enabled &&
    (isCloud
      ? !!apiKey || isApiKeyConfigured
      : (endpoint ?? "").trim() !== "" || aiProviderMatches);

  const {
    models: availableModels,
    refusal: modelRefusal,
    isLoading: isLoadingModels,
  } = useAvailableModelsQuery({
    provider: (enabled ? provider : "openai") as AIConfig["provider"],
    endpoint: endpoint || (aiProviderMatches ? aiConfig?.endpoint : undefined),
    apiKey: apiKey || undefined,
    enabled: !!canFetchModels,
  });

  const modelOptions = useMemo(() => {
    const options = availableModels.map((available) => available.id);

    if (model && !options.includes(model)) {
      options.unshift(model);
    }

    return options;
  }, [availableModels, model]);

  const hasChanges = useMemo(() => {
    const stored = imageGenerationConfig;

    return (
      provider !== (stored?.provider ?? "disabled") ||
      model !== (stored?.model ?? "") ||
      endpoint !== (stored?.endpoint ?? "") ||
      apiKey.trim() !== ""
    );
  }, [imageGenerationConfig, provider, model, endpoint, apiKey]);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const handleRevealApiKey = useCallback(async () => {
    return await fetchConfigSecret(ServerConfigKeys.IMAGE_GENERATION_CONFIG, "apiKey");
  }, [fetchConfigSecret]);

  const handleProviderChange = (newProvider: ImageGenerationProvider) => {
    if (newProvider === provider) return;
    setProvider(newProvider);
    // Model names and keys never carry across providers.
    setApiKey("");
    setModel("");
    if (!imageGenerationProviderNeedsEndpoint(newProvider) && newProvider !== "azure") {
      setEndpoint("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateImageGenerationConfig({
        provider,
        model: model || undefined,
        endpoint: endpoint || undefined,
        // An empty key preserves the stored one on the server.
        apiKey: apiKey || undefined,
      });
      setApiKey("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <p className="text-muted text-sm">{t("description")}</p>

      <Select
        variant="secondary"
        placeholder={t("provider")}
        value={provider}
        onChange={(selected) => {
          if (typeof selected === "string") {
            handleProviderChange(selected as ImageGenerationProvider);
          }
        }}
      >
        <Label>{t("provider")}</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {PROVIDER_OPTIONS.map((option) => {
              const label =
                option === "lm-studio"
                  ? t("providers.lmStudio")
                  : option === "generic-openai"
                    ? t("providers.genericOpenai")
                    : t(`providers.${option}` as Parameters<typeof t>[0]);

              return (
                <ListBox.Item key={option} id={option} textValue={label}>
                  {label}
                </ListBox.Item>
              );
            })}
          </ListBox>
        </Select.Popover>
      </Select>

      {aiProviderMatches && <p className="text-muted text-xs">{t("fallbackHint")}</p>}

      {(needsEndpoint || supportsOptionalEndpoint) && (
        <TextField value={endpoint} onChange={setEndpoint}>
          <Label>{t("endpoint")}</Label>
          <Input
            variant="secondary"
            placeholder={
              provider === "azure"
                ? "https://your-resource.openai.azure.com"
                : "http://localhost:1234"
            }
          />
          {supportsOptionalEndpoint && <Description>{t("endpointOptional")}</Description>}
        </TextField>
      )}

      {showApiKey && (
        <SecretInput
          isConfigured={isApiKeyConfigured}
          label={t("apiKey")}
          placeholder={t("apiKeyPlaceholder")}
          value={apiKey}
          onReveal={handleRevealApiKey}
          onValueChange={setApiKey}
        />
      )}

      {enabled && (
        <ComboBox
          allowsCustomValue
          inputValue={model}
          isDisabled={!canFetchModels}
          onInputChange={setModel}
          onSelectionChange={(key) => key && setModel(key as string)}
        >
          <Label>{t("model")}</Label>
          <ComboBox.InputGroup>
            <Input variant="secondary" placeholder={t("modelPlaceholder")} />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <Description>{t("modelDescription")}</Description>
          <ComboBox.Popover>
            <ListBox
              renderEmptyState={() => (
                <ModelListingEmptyState isLoading={isLoadingModels} refusal={modelRefusal} />
              )}
            >
              {modelOptions.map((option) => (
                <ListBox.Item key={option} id={option} textValue={option}>
                  {option}
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button isDisabled={!hasChanges} onPress={handleSave} variant="primary" isPending={saving}>
          {<CheckIcon className="h-5 w-5" />}
          {tActions("save")}
        </Button>
      </div>
    </div>
  );
}
