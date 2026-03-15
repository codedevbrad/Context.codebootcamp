/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Context` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Context" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Context_slug_key" ON "Context"("slug");
