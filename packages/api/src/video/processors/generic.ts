import type { FullRecipeInsertDTO } from "@norish/shared/contracts/dto/recipe";
import { extractRecipeFromVideo } from "@norish/api/video/normalizer";
import { transcribe } from "@norish/shared-server/ai/runtime/runtime";
import { videoLogger as log } from "@norish/shared-server/logger";
import { hasSteps } from "@norish/shared/lib/helpers";

import type { VideoMetadata, VideoProcessorContext } from "../types";
import { BaseVideoProcessor } from "../base-processor";
import { captionFailureAllowsTranscription } from "../errors";

/**
 * Generic video processor for platforms without specific handling.
 * For posts without a video stream (such as TikTok photo slideshows), extracts
 * from the caption first and falls back to audio transcription only if needed.
 */
export class GenericVideoProcessor extends BaseVideoProcessor {
  readonly name = "GenericVideoProcessor";

  async process(context: VideoProcessorContext): Promise<FullRecipeInsertDTO> {
    const { url, recipeId, tokens } = context;

    let audioPath: string | null = null;
    let videoPath: string | null = null;

    try {
      log.info({ url }, "Processing generic video");

      const metadata = await this.getMetadata(url, tokens);

      if (metadata.videoStream === "absent") {
        return await this.processWithoutVideo(url, recipeId, metadata, tokens, (p) => {
          audioPath = p;
        });
      }

      await this.validateLength(url, tokens);

      // Download video file
      videoPath = await this.downloadAndConvertVideo(url, tokens);

      // Download and transcribe audio
      audioPath = await this.downloadAudio(url, tokens);
      log.info({ url }, "Starting audio transcription");

      const transcript = await transcribe(audioPath);

      log.info({ url, transcriptLength: transcript.length }, "Audio transcribed");

      // Combine transcript with description
      const descriptionText = metadata.description?.trim() || "";
      const combinedText = [transcript, descriptionText].filter(Boolean).join("\n\n---\n\n");

      const recipe = await extractRecipeFromVideo(combinedText, metadata, recipeId, url);

      const savedVideo = videoPath
        ? await this.saveVideo(videoPath, recipeId, metadata.duration)
        : null;

      return this.addVideoToRecipe(recipe, savedVideo);
    } finally {
      await this.cleanup(audioPath);
      if (videoPath?.includes("video-temp")) {
        await this.cleanup(videoPath);
      }
    }
  }

  private async processWithoutVideo(
    url: string,
    recipeId: string,
    metadata: VideoMetadata,
    tokens: VideoProcessorContext["tokens"],
    onAudioDownloaded: (path: string) => void
  ): Promise<FullRecipeInsertDTO> {
    log.info({ url }, "Post has no video stream, trying caption extraction");

    const descriptionText = metadata.description?.trim() || "";
    let captionRecipe: FullRecipeInsertDTO | null = null;

    if (descriptionText.length > 0) {
      try {
        const recipe = await extractRecipeFromVideo(descriptionText, metadata, recipeId, url);

        if (hasSteps(recipe)) {
          return recipe;
        }

        captionRecipe = recipe;
        log.info({ url }, "Caption held no steps, trying audio transcription");
      } catch (err) {
        if (!captionFailureAllowsTranscription(err)) {
          throw err;
        }

        log.info({ url, err }, "Caption extraction failed, trying audio transcription");
      }
    }

    return this.withTranscriptSteps(captionRecipe, async () => {
      const downloadedAudio = await this.downloadAudio(url, tokens);

      onAudioDownloaded(downloadedAudio);
      log.info({ url }, "Starting audio transcription");

      const transcript = await transcribe(downloadedAudio);

      log.info({ url, transcriptLength: transcript.length }, "Audio transcribed");

      const combinedText = [transcript, descriptionText].filter(Boolean).join("\n\n---\n\n");

      return extractRecipeFromVideo(combinedText, metadata, recipeId, url);
    });
  }
}
