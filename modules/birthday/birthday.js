var birthday = function(abot) {
    var self = this;
    var command = abot.modules["command"];
    var sqlite = abot.modules["sqlite"];
    self.checkDbInit = function() {
        sqlite.db.run("CREATE TABLE IF NOT EXISTS birthday(tag TEXT PRIMARY KEY, date INTEGER NOT NULL)");
    };
    self.saveBirthday = async function(tag, date) {
    }
    self.checkDbInit();
    command.addCommand("addbday","",async function(msg, args) {
        if(args.length != 2) {
            msg.channel.send("Usage: !addbday [tag] [date].");
            return;
        }
        if(msg.mentions.users.array().length > 1) {
            msg.channel.send("Please only mention one user at a time.");
            return;
        }
        var buser = msg.mentions.users.first();
        console.log("Tag was: ",buser.tag);
        var timestamp=Date.parse(args[1]);
        if(isNaN(timestamp)) {
            msg.channel.send("Sorry I couldn't parse that date.");
            return;
        }
        var bdate = new Date(timestamp);
        bdate.setHours(0);
        bdate.setMinutes(0);
        bdate.setSeconds(0);
        bdate.setMilliseconds(0);
        await self.saveBirthday(bdate);
        msg.channel.send("addbday: "+bdate);
    });
};

exports.fetch = function(abot) {
    return new birthday(abot);
};
