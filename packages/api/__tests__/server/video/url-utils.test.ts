// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  detectPlatform,
  isFacebookUrl,
  isInstagramUrl,
  isYouTubeUrl,
  normalizeTikTokPhotoUrl,
} from "@norish/api/video/url-utils";

describe("URL detection utilities", () => {
  describe("isInstagramUrl", () => {
    it("returns true for instagram.com URLs", () => {
      expect(isInstagramUrl("https://www.instagram.com/p/ABC123/")).toBe(true);
      expect(isInstagramUrl("https://instagram.com/reel/ABC123/")).toBe(true);
    });

    it("returns false for non-Instagram URLs", () => {
      expect(isInstagramUrl("https://www.youtube.com/watch?v=ABC123")).toBe(false);
      expect(isInstagramUrl("https://facebook.com/video/123")).toBe(false);
    });

    it("returns false for hosts that only contain the domain", () => {
      expect(isInstagramUrl("https://instagram.com.example.net/p/ABC123/")).toBe(false);
      expect(isInstagramUrl("https://notinstagram.com/p/ABC123/")).toBe(false);
    });

    it("returns false for invalid URLs", () => {
      expect(isInstagramUrl("not-a-url")).toBe(false);
      expect(isInstagramUrl("")).toBe(false);
    });
  });

  describe("isFacebookUrl", () => {
    it("returns true for facebook.com URLs", () => {
      expect(isFacebookUrl("https://www.facebook.com/watch?v=123")).toBe(true);
      expect(isFacebookUrl("https://facebook.com/video/123")).toBe(true);
    });

    it("returns true for fb.watch URLs", () => {
      expect(isFacebookUrl("https://fb.watch/ABC123/")).toBe(true);
    });

    it("returns false for non-Facebook URLs", () => {
      expect(isFacebookUrl("https://www.youtube.com/watch?v=ABC123")).toBe(false);
      expect(isFacebookUrl("https://instagram.com/p/ABC123/")).toBe(false);
    });

    it("returns false for invalid URLs", () => {
      expect(isFacebookUrl("not-a-url")).toBe(false);
      expect(isFacebookUrl("")).toBe(false);
    });
  });

  describe("isYouTubeUrl", () => {
    it("returns true for youtube.com URLs", () => {
      expect(isYouTubeUrl("https://www.youtube.com/watch?v=ABC123")).toBe(true);
      expect(isYouTubeUrl("https://youtube.com/shorts/ABC123")).toBe(true);
    });

    it("returns true for youtu.be URLs", () => {
      expect(isYouTubeUrl("https://youtu.be/ABC123")).toBe(true);
    });

    it("returns false for non-YouTube URLs", () => {
      expect(isYouTubeUrl("https://www.facebook.com/video/123")).toBe(false);
      expect(isYouTubeUrl("https://instagram.com/p/ABC123/")).toBe(false);
    });

    it("returns false for invalid URLs", () => {
      expect(isYouTubeUrl("not-a-url")).toBe(false);
      expect(isYouTubeUrl("")).toBe(false);
    });
  });

  describe("detectPlatform", () => {
    it("detects Instagram URLs", () => {
      expect(detectPlatform("https://www.instagram.com/p/ABC123/")).toBe("instagram");
    });

    it("detects Facebook URLs", () => {
      expect(detectPlatform("https://www.facebook.com/watch?v=123")).toBe("facebook");
      expect(detectPlatform("https://fb.watch/ABC123/")).toBe("facebook");
    });

    it("detects YouTube URLs", () => {
      expect(detectPlatform("https://www.youtube.com/watch?v=ABC123")).toBe("youtube");
      expect(detectPlatform("https://youtu.be/ABC123")).toBe("youtube");
    });

    it("returns generic for unknown platforms", () => {
      expect(detectPlatform("https://www.tiktok.com/@user/video/123")).toBe("generic");
      expect(detectPlatform("https://vimeo.com/123456")).toBe("generic");
    });

    it("throws for invalid URLs", () => {
      expect(() => detectPlatform("not-a-url")).toThrow();
      expect(() => detectPlatform("")).toThrow();
    });
  });

  describe("normalizeTikTokPhotoUrl", () => {
    it("rewrites TikTok /photo/ URLs to /video/ preserving query params", () => {
      expect(
        normalizeTikTokPhotoUrl(
          "https://www.tiktok.com/@dailycookewithbella/photo/7705307625692417302?_r=1&_t=ZN-9BUra3w3J0Y"
        )
      ).toBe(
        "https://www.tiktok.com/@dailycookewithbella/video/7705307625692417302?_r=1&_t=ZN-9BUra3w3J0Y"
      );
      expect(normalizeTikTokPhotoUrl("https://tiktok.com/photo/7705307625692417302")).toBe(
        "https://tiktok.com/video/7705307625692417302"
      );
    });

    it("leaves TikTok /video/, shortlinks, and other hosts untouched", () => {
      expect(normalizeTikTokPhotoUrl("https://www.tiktok.com/@user/video/123")).toBe(
        "https://www.tiktok.com/@user/video/123"
      );
      expect(normalizeTikTokPhotoUrl("https://vm.tiktok.com/ZN8aDGLP4/")).toBe(
        "https://vm.tiktok.com/ZN8aDGLP4/"
      );
      expect(normalizeTikTokPhotoUrl("https://evil-tiktok.com/@user/photo/123")).toBe(
        "https://evil-tiktok.com/@user/photo/123"
      );
    });
  });
});
