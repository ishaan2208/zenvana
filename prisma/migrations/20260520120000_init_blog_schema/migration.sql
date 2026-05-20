-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "blog";

-- CreateEnum
CREATE TYPE "blog"."BlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "blog"."BlogMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "blog"."BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "alternateHref" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageUrl" TEXT,
    "twitterTitle" TEXT,
    "twitterDescription" TEXT,
    "twitterImageUrl" TEXT,
    "heroImageUrl" TEXT,
    "status" "blog"."BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "isIndexable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog"."BlogMedia" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "type" "blog"."BlogMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "blog"."BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "blog"."BlogPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "BlogMedia_blogPostId_sortOrder_idx" ON "blog"."BlogMedia"("blogPostId", "sortOrder");

-- AddForeignKey
ALTER TABLE "blog"."BlogMedia" ADD CONSTRAINT "BlogMedia_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "blog"."BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
