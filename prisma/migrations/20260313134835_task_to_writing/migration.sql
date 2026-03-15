/*
  Warnings:

  - A unique constraint covering the columns `[ganttTaskId]` on the table `ProjectWriting` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "specification" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "ProjectWriting" ADD COLUMN     "ganttTaskId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectWriting_ganttTaskId_key" ON "ProjectWriting"("ganttTaskId");

-- AddForeignKey
ALTER TABLE "ProjectWriting" ADD CONSTRAINT "ProjectWriting_ganttTaskId_fkey" FOREIGN KEY ("ganttTaskId") REFERENCES "GanttTasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
