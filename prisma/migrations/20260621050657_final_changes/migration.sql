-- CreateTable
CREATE TABLE "PullRequestAnalytics" (
    "id" SERIAL NOT NULL,
    "repositoryId" INTEGER NOT NULL,
    "githubPrId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "mergedAt" TIMESTAMP(3),
    "firstReviewedAt" TIMESTAMP(3),
    "reviewDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PullRequestAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeploymentAnalytics" (
    "id" SERIAL NOT NULL,
    "repositoryId" INTEGER NOT NULL,
    "githubDeploymentId" TEXT NOT NULL,
    "environment" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeploymentAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PullRequestAnalytics_githubPrId_key" ON "PullRequestAnalytics"("githubPrId");

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentAnalytics_githubDeploymentId_key" ON "DeploymentAnalytics"("githubDeploymentId");

-- AddForeignKey
ALTER TABLE "PullRequestAnalytics" ADD CONSTRAINT "PullRequestAnalytics_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentAnalytics" ADD CONSTRAINT "DeploymentAnalytics_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
