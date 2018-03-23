var command = function(abot) {
    var self = this;
    console.log("Loaded command!");
    abot.client.on("message", async message => {
        if(message.content.indexOf(abot.config.prefix) !== 0) return;
        const args = message.content.slice(abot.config.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        if(command === "getid") {
            var id = args[0];
            message.channel.send(message.author+": User's ID is "+id.slice(2,id.length-1));
        }
    });
    
    self.debug = function(channel) {
        channel.send("DEBUG!");
    }
};

exports.fetch = function(abot) {
    return new command(abot);
};
