-- AlterTable
ALTER TABLE "RepositoryMetrics" ADD COLUMN     "failedBuilds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "successfulBuilds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalBuilds" INTEGER NOT NULL DEFAULT 0;
