// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FullRecipeInsertDTO } from "@norish/shared/contracts/dto/recipe";
import { GenericVideoProcessor } from "@norish/api/video/processors/generic";
import { AIProviderError, AIResponseError } from "@norish/shared-server/ai/runtime/errors";

const boundary = vi.hoisted(() => ({
  getVideoMetadata: vi.fn(),
  validateVideoLength: vi.fn(),
  downloadVideo: vi.fn(),
  downloadVideoAudio: vi.fn(),
  transcribe: vi.fn(),
  extractRecipeFromVideo: vi.fn(),
  saveVideoFile: vi.fn(),
}));

vi.mock("@norish/api/video/yt-dlp", () => ({
  getVideoMetadata: boundary.getVideoMetadata,
  validateVideoLength: boundary.validateVideoLength,
  downloadVideo: boundary.downloadVideo,
  downloadVideoAudio: boundary.downloadVideoAudio,
  getFfmpegPath: () => null,
}));

vi.mock("@norish/shared-server/media/storage", () => ({
  convertToMp4: vi.fn().mockResolvedValue({ filePath: "/tmp/v.mp4", converted: false }),
  saveVideoFile: boundary.saveVideoFile,
}));

vi.mock("@norish/shared-server/ai/runtime/runtime", () => ({ transcribe: boundary.transcribe }));
vi.mock("@norish/api/video/normalizer", () => ({
  extractRecipeFromVideo: boundary.extractRecipeFromVideo,
}));
vi.mock("@norish/api/video/cleanup", () => ({ cleanupFile: vi.fn() }));
vi.mock("@norish/shared-server/logger", () => ({
  videoLogger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function process() {
  return new GenericVideoProcessor().process({
    url: "https://vm.tiktok.com/ZN8aDGLP4/",
    recipeId: "recipe-1",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  boundary.downloadVideo.mockResolvedValue({ filePath: "/tmp/v.mp4", extension: ".mp4" });
  boundary.downloadVideoAudio.mockResolvedValue("/tmp/a.mp3");
  boundary.transcribe.mockResolvedValue("Mix tuna and cottage cheese");
  boundary.saveVideoFile.mockResolvedValue({ video: "recipes/recipe-1/v.mp4", duration: 42 });
});

describe("GenericVideoProcessor", () => {
  it("extracts from caption without downloading video or audio when videoStream is absent", async () => {
    boundary.getVideoMetadata.mockResolvedValue({
      title: "Tuna Patties",
      description: "Mix canned tuna with cottage cheese and air fry at 200C for 10-12 minutes.",
      duration: 42,
      thumbnail: "https://cdn.example/cover.jpg",
      videoStream: "absent",
    });
    boundary.extractRecipeFromVideo.mockResolvedValue({
      name: "Tuna Patties",
      steps: [{ step: "Mix and air fry.", systemUsed: "metric", order: 0 }],
    } as FullRecipeInsertDTO);

    const recipe = await process();

    expect(recipe).toMatchObject({ name: "Tuna Patties" });
    expect(boundary.validateVideoLength).not.toHaveBeenCalled();
    expect(boundary.downloadVideo).not.toHaveBeenCalled();
    expect(boundary.downloadVideoAudio).not.toHaveBeenCalled();
    expect(boundary.transcribe).not.toHaveBeenCalled();
    expect(boundary.saveVideoFile).not.toHaveBeenCalled();
  });

  it("falls back to audio transcription without downloading video when videoStream is absent and caption has no recipe", async () => {
    boundary.getVideoMetadata.mockResolvedValue({
      title: "Tuna Patties",
      description: "Easy lunch!",
      duration: 42,
      thumbnail: "https://cdn.example/cover.jpg",
      videoStream: "absent",
    });
    boundary.extractRecipeFromVideo
      .mockRejectedValueOnce(new AIResponseError("missing required fields"))
      .mockResolvedValueOnce({
        name: "Tuna Patties",
        steps: [{ step: "Mix tuna and cottage cheese.", systemUsed: "metric", order: 0 }],
      } as FullRecipeInsertDTO);

    const recipe = await process();

    expect(recipe).toMatchObject({ name: "Tuna Patties" });
    expect(boundary.downloadVideo).not.toHaveBeenCalled();
    expect(boundary.downloadVideoAudio).toHaveBeenCalled();
    expect(boundary.transcribe).toHaveBeenCalledWith("/tmp/a.mp3");
  });

  it("does not fall back to audio transcription when the AI provider fails on caption extraction", async () => {
    const providerError = new AIProviderError("Rate limited", { retryable: true });

    boundary.getVideoMetadata.mockResolvedValue({
      title: "Tuna Patties",
      description: "Mix canned tuna with cottage cheese.",
      duration: 42,
      thumbnail: "",
      videoStream: "absent",
    });
    boundary.extractRecipeFromVideo.mockRejectedValue(providerError);

    await expect(process()).rejects.toBe(providerError);
    expect(boundary.transcribe).not.toHaveBeenCalled();
  });

  it("downloads video and transcribes audio when videoStream is present", async () => {
    boundary.getVideoMetadata.mockResolvedValue({
      title: "Yogurt Bowl",
      description: "180g Greek yogurt",
      duration: 63,
      thumbnail: "",
      videoStream: "present",
    });
    boundary.extractRecipeFromVideo.mockResolvedValue({
      name: "Yogurt Bowl",
      steps: [{ step: "Whisk together.", systemUsed: "metric", order: 0 }],
    } as FullRecipeInsertDTO);

    const recipe = await process();

    expect(recipe.videos).toEqual([{ video: "recipes/recipe-1/v.mp4", duration: 42, order: 0 }]);
    expect(boundary.validateVideoLength).toHaveBeenCalled();
    expect(boundary.downloadVideo).toHaveBeenCalled();
    expect(boundary.downloadVideoAudio).toHaveBeenCalled();
    expect(boundary.transcribe).toHaveBeenCalledWith("/tmp/a.mp3");
  });
});
