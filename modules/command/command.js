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
            var cmdObj = self.commands[cmd];
            var authUsers = self.config[cmdObj.access];
            if(cmdObj.access === "" || (authUsers && authUsers.includes(message.author.tag))) {
                cmdObj.handler(message, args);
            } else {
                message.channel.send("I'm sorry "+message.author+", I'm afraid I can't do that.");
            }
        }
    });
    
    self.addCommand = function(command, access, handler) {
        if(!command || !access || !handler) {
            console.log("Command: Error adding command "+command+" you have to specify command, access and handler");
            return;
        }
        self.commands[command] = {access: access, handler: handler};
    }
};

exports.fetch = function(abot) {
    return new command(abot);
};
