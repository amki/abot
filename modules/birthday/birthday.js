const Discord = require('discord.js');

var birthday = function(abot) {
    var self = this;
    var command = abot.modules["command"];
    var sqlite = abot.modules["sqlite"];
    
    self.onCreate = () => {
        console.log("Should attach to ",abot.client.guilds.size);
    };

    abot.client.on("ready",() => {
        self.onCreate();
    });

    self.checkDbInit = function(guild) {
        if(sqlite.db[guild.id] == null) {
            sqlite.loadDb(guild.id);
        }
        return new Promise(function(resolve, reject) {
            sqlite.db[guild.id].run("CREATE TABLE IF NOT EXISTS birthday(tag TEXT PRIMARY KEY, date INTEGER NOT NULL)", function(err) {
                if(err != null) {
                    reject(err);
                }
                resolve();
            });
        });

    };
    command.addCommand({command: "bdayadd", access: Discord.Permissions.FLAGS.SEND_MESSAGES, handler: async function(msg, args) {
        if(args.length != 2) {
            msg.channel.send("Usage: !addbday [tag] [date].");
            return;
        }
        if(msg.mentions.users.array().length > 1) {
            msg.channel.send("Please only mention one user at a time.");
            return;
        }
        var guild = msg.guild;
        if(msg.guild == null) {
            msg.channel.send("You can only add birthdays to a guild. Try using this in a guild.");
            return;
        }
        await self.checkDbInit(guild);
        var buser = msg.mentions.users.first();
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
        sqlite.db[guild.id].run("INSERT OR REPLACE INTO birthday (tag, date) VALUES ($tag, $date)",{"$tag": buser.tag, "$date": bdate.getTime()}, function(err) {
            if(err) {
                console.log("Birthday ERROR inserting into birthday table: ",err);
                msg.channel.send("I could not save this birthday: "+err.message);
                return;
            }
            msg.channel.send("I saved "+bdate+" as birthday for "+buser);
        });
    }});

    command.addCommand({command: "bdayshow", access: Discord.Permissions.FLAGS.SEND_MESSAGES, handler: async function(msg, args) {
        if(args.length != 1) {
            msg.channel.send("Usage: !addbday [tag].");
            return;
        }
        if(msg.mentions.users.array().length > 1) {
            msg.channel.send("Please only mention one user at a time.");
            return;
        }
        var guild = msg.guild;
        if(msg.guild == null) {
            msg.channel.send("You can only fetch birthdays for a guild. Try using this in a guild.");
            return;
        }
        await self.checkDbInit(guild);
        var buser = msg.mentions.users.first();
        sqlite.db[guild.id].all("SELECT * FROM birthday WHERE tag = $tag",{"$tag": buser.tag}, function(err,rows) {
            if(rows.length < 1) {
                msg.channel.send("I don't know when "+buser+"'s birthday is. Add it with !bdayadd. :)");
                return;
            }
            // tag is UNIQUE, can only be 1 hit
            var row = rows[0];
            var bdate = new Date(row.date);
            msg.channel.send("I have "+bdate+" saved as birthday for "+buser);
        });

    }});

    command.addCommand({command: "bdaynotifychannel", access: Discord.Permissions.FLAGS.SEND_MESSAGES, handler: async function(msg, args) {

    }});
};

exports.fetch = function(abot) {
    return new birthday(abot);
};
