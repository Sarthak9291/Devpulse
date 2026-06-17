-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "RepositoryMetrics" (
    "id" SERIAL NOT NULL,
    "repositoryId" INTEGER NOT NULL,
    "pushCount" INTEGER NOT NULL DEFAULT 0,
    "prOpenedCount" INTEGER NOT NULL DEFAULT 0,
    "prMergedCount" INTEGER NOT NULL DEFAULT 0,
    "issueOpenedCount" INTEGER NOT NULL DEFAULT 0,
    "issueClosedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryMetrics_repositoryId_key" ON "RepositoryMetrics"("repositoryId");

-- AddForeignKey
ALTER TABLE "RepositoryMetrics" ADD CONSTRAINT "RepositoryMetrics_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
