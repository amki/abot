var command = function(abot) {
    var self = this;
    self.commands = {};
    console.log("Started command!");
    abot.client.on("message", async message => {
        if(message.content.indexOf(abot.config.prefix) !== 0) return;
        const args = message.content.slice(abot.config.prefix.length).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();

        var cmdList = Object.keys(self.commands);
        if(cmdList.includes(cmd)) {
            console.log("Found command ",cmd);
            var func = self.commands[cmd];
            func(message, args);
        }
    });
    
    self.addCommand = function(command, handler) {
        self.commands[command] = handler;
    }
};

exports.fetch = function(abot) {
    return new command(abot);
};
