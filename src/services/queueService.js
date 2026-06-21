const webhookQueue = require("../queues/webhookQueue");

const getQueueMetrics = async () => {
    const counts = await webhookQueue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting');
    
    // Fetch failed jobs representing the Dead Letter Queue (DLQ)
    const failedJobs = await webhookQueue.getFailed(0, 100);
    const deadLetterQueue = failedJobs.map(job => ({
        id: job.id,
        name: job.name,
        data: {
            repositoryId: job.data?.repositoryId,
            eventType: job.data?.eventType,
            action: job.data?.action
        },
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        processedOn: job.processedOn ? new Date(job.processedOn) : null,
        finishedOn: job.finishedOn ? new Date(job.finishedOn) : null
    }));

    // Calculate queue lag (time from submission to processing) from completed jobs
    const completedJobs = await webhookQueue.getCompleted(0, 50);
    let totalLagMs = 0;
    let count = 0;
    for (const job of completedJobs) {
        if (job.processedOn && job.timestamp) {
            totalLagMs += (job.processedOn - job.timestamp);
            count++;
        }
    }
    const averageQueueLagMs = count === 0 ? 0 : Math.round(totalLagMs / count);

    // Calculate retry metrics
    let retriedJobsCount = 0;
    for (const job of completedJobs) {
        if (job.attemptsMade > 1) {
            retriedJobsCount++;
        }
    }
    for (const job of failedJobs) {
        if (job.attemptsMade > 1) {
            retriedJobsCount++;
        }
    }

    return {
        counts,
        averageQueueLagMs,
        retryMetrics: {
            retriedJobsCount,
            totalChecked: completedJobs.length + failedJobs.length
        },
        deadLetterQueueCount: counts.failed,
        deadLetterQueue
    };
};

module.exports = {
    getQueueMetrics
};
