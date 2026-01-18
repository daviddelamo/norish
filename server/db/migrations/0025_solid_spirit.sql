ALTER TABLE "apikey" ALTER COLUMN "rateLimitEnabled" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "rateLimitMax" SET DEFAULT 100000;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "language" text DEFAULT 'en' NOT NULL;