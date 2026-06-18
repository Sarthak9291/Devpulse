const IORedis = require('ioredis');
const redisConnection = require("../config/redis")

const publishActivity = async (activity) => {
    await redisConnection.publish('activity', JSON.stringify(activity));

}
const publishMetrics= async(repositoryId, metrics) => {
    await redisConnection.publish("metrics-updated", JSON.stringify({repositoryId, metrics}));
}

module.exports = {
    publishActivity,
    publishMetrics
}