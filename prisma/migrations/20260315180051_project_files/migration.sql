/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `ProjectWriting` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProjectWriting" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectWriting_slug_key" ON "ProjectWriting"("slug");
