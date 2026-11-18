import { z } from "zod";

import { isOnDomain } from "@norish/shared/lib/helpers";

import type { VideoPlatform } from "./types";

const urlSchema = z.url();

/**
 * Check if URL is from Instagram.
 */
export function isInstagramUrl(url: string): boolean {
  return isOnDomain(url, "instagram.com");
}

/**
 * Check if URL is from Facebook.
 */
export function isFacebookUrl(url: string): boolean {
  return isOnDomain(url, "facebook.com", "fb.watch");
}

/**
 * Check if URL is from YouTube.
 */
export function isYouTubeUrl(url: string): boolean {
  return isOnDomain(url, "youtube.com", "youtu.be");
}

/**
 * Detect the video platform from a URL.
 * @throws ZodError if the URL is invalid
 */
export function detectPlatform(url: string): VideoPlatform {
  urlSchema.parse(url);

  if (isInstagramUrl(url)) return "instagram";
  if (isFacebookUrl(url)) return "facebook";
  if (isYouTubeUrl(url)) return "youtube";

  return "generic";
}

/**
 * Rewrite a TikTok `/photo/<id>` slideshow URL to `/video/<id>` so yt-dlp's
 * TikTok extractor accepts it and returns the post's metadata, caption,
 * thumbnail, and audio track.
 */
export function normalizeTikTokPhotoUrl(url: string): string {
  if (!isOnDomain(url, "tiktok.com")) return url;

  const parsed = URL.parse(url);

  if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
    return url;
  }

  const updatedPath = parsed.pathname.replace(/^(\/@[^/]+)?\/photo\/(\d+)/, "$1/video/$2");

  if (updatedPath === parsed.pathname) return url;

  parsed.pathname = updatedPath;

  return parsed.toString();
}
