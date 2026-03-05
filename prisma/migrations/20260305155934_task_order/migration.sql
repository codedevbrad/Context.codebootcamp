-- CreateEnum
CREATE TYPE "GanttColumnType" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "GanttTasks" ADD COLUMN     "ganttcolumnType" "GanttColumnType" NOT NULL DEFAULT 'PLANNED',
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;
