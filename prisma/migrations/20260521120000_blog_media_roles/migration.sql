-- CreateEnum
CREATE TYPE "blog"."BlogMediaRole" AS ENUM ('HERO_DESKTOP', 'HERO_MOBILE', 'THUMBNAIL', 'OG', 'INLINE', 'GALLERY');

-- AlterTable
ALTER TABLE "blog"."BlogMedia"
  ADD COLUMN "role" "blog"."BlogMediaRole" NOT NULL DEFAULT 'GALLERY',
  ADD COLUMN "bytes" INTEGER,
  ADD COLUMN "format" TEXT;

-- CreateIndex
CREATE INDEX "BlogMedia_blogPostId_role_idx" ON "blog"."BlogMedia"("blogPostId", "role");
