-- AlterTable
ALTER TABLE "blog"."BlogPost" ADD COLUMN     "authorName" TEXT NOT NULL DEFAULT 'Zenvana Hotels';

-- CreateTable
CREATE TABLE "blog"."BlogSlugRedirect" (
    "fromSlug" TEXT NOT NULL,
    "toSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogSlugRedirect_pkey" PRIMARY KEY ("fromSlug")
);

-- CreateIndex
CREATE INDEX "BlogSlugRedirect_toSlug_idx" ON "blog"."BlogSlugRedirect"("toSlug");
