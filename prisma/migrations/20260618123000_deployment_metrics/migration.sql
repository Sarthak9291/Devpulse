-- AlterTable
ALTER TABLE "RepositoryMetrics" ADD COLUMN     "deploymentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "failedDeployments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "releaseCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "successfulDeployments" INTEGER NOT NULL DEFAULT 0;
