const subscriber =
    require("./subscriber");

const { getIO } =
    require("../socket/socket");

const startListeners=async()=>{
    await subscriber.subscribe("activity-created" );
    await subscriber.subscribe("metrics-updated");
    subscriber.on("message", (channel, message) => {
        if (channel ==="activity-created") {
        const io = getIO();
        io.emit(
            "activity-created",
            JSON.parse(message)
        );
        }
        if(channel === "metrics-updated"){
            const io = getIO();
            const {repositoryId, metrics} = JSON.parse(message);
            io.emit(
                "metrics-updated",
                {repositoryId, metrics}
            );
        }
    });
}

module.exports = {
    startListeners
}