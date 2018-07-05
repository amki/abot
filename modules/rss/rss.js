const Discord = require('discord.js'),
FeedParser = require('feedparser'),
Request = require('request');

var rss = function(abot) {
    var self = this;
    var sqlite = abot.modules["sqlite"];

    self.checkFeed = async (guildDb, channel, name, url, lastposttime ) => {
        console.log("checkFeed: Starting check.");
        var req = Request(url);
        var feedparser = new FeedParser();

        req.on('error', function (err) {
            channel.send("RSS: Request for RSS feed got an error: "+err+" Start self-destruct sequence.");
        });

        req.on('response', function (res) {
            var stream = this;
            if (res.statusCode !== 200){
                channel.send("RSS: RSS server returned status code "+res.statusCode+". Bastard.");
                return;
            }
            stream.pipe(feedparser);
        });

        var newtime = lastposttime;

        feedparser.on('error', function(err) {
            channel.send("RSS: Feedparser encountered an error: "+err+";;; Inform administrator!");
        });

        feedparser.on('readable', function() {
            // This is where the action is!
            var stream = this, 
                meta = this.meta, // **NOTE** the "meta" is always available in the context of the feedparser instance
                item;

            while (item = stream.read()) {
                if(!item.pubdate) {
                    continue;
                }
                if(item.pubdate.getTime() - lastposttime > 0) {
                    console.log("newtime: "+newtime+" itemtime: "+item.pubdate.getTime());
                    if(item.pubdate.getTime() > newtime) {
                        newtime = item.pubdate.getTime();
                        console.log("newtime: "+newtime+" from "+item.title);
                    }
                    channel.send("<"+name+"> "+item.title+" | "+item.link);
                }
            }
        });

        feedparser.on('end', function() {
            guildDb.run("UPDATE rss SET lastposttime = $newtime WHERE name = $name",{"$name": name, "$newtime": newtime}, function(err) {
                if(err) {
                    channel.send("Could not save newtime. Critical! See console.");
                    console.log("SQL ERROR: ",err);
                    return;
                }
            });
        });
    };

    self.onCreate = async () => {
        self.timeoutId = setInterval(() => {
            var guildIds = Object.keys(sqlite.db);
            for(var i=0;i<guildIds.length;++i) {
                var guildId = guildIds[i];
                var guild = abot.client.guilds.get(guildId);
                self.checkDbInit(guild).then(()=> {
                    var guildDb = sqlite.db[guildId];
                    guildDb.all("SELECT * FROM rss",{}, function(err,rows) {
                        if(err) {
                            msg.channel.send("Could not load feed. :( See console.");
                            console.log("SQL ERROR: ",err);
                            return;
                        }
                        for(var j=0;j<rows.length;++j) {
                            var row=rows[j];
                            var channel = guild.channels.get(row.channel);
                            self.checkFeed(guildDb, channel, row.name, row.url, row.lastposttime).then((res) =>{
                                //channel.send("Feed "+row.name+" checked!");
                            });
                        }
                    });
                });
            }
        },10000);
    };

    self.onDestroy = async () => {
        clearInterval(self.timeoutId);
    };

    self.checkDbInit = function(guild) {
        if(sqlite.db[guild.id] == null) {
            sqlite.openDb(guild.id);
        }
        
        return new Promise(function(resolve, reject) {
            sqlite.db[guild.id].run("CREATE TABLE IF NOT EXISTS rss(name TEXT PRIMARY KEY, channel TEXT NOT NULL, url TEXT NOT NULL, lastposttime INTEGER NOT NULL)", function(err) {
                if(err != null) {
                    console.log("ERROR CHECK DB: ",err);
                    reject(err);
                }
                resolve();
            });
        });
    };

    abot.addCommand({command: "rssadd", argCount: 2, access: Discord.Permissions.FLAGS.SEND_MESSAGES, handler: async function(msg, args) {
        var guild = msg.guild;
        await self.checkDbInit(guild);

        sqlite.db[guild.id].run("INSERT OR REPLACE INTO rss (name, channel, url, lastposttime) VALUES ($name, $channel, $url, $lastposttime)",{"$name": args[0], "$channel": msg.channel.id, "$url":args[1], "$lastposttime": Date.now()}, function(err) {
            if(err) {
                msg.channel.send("Could not save feed. :( See console.");
                console.log("SQL ERROR: ",err);
                return;
            }
            msg.channel.send("Feed has been saved!");
        });
    }});

    abot.addCommand({command: "rssdebug", argCount: 1, access: Discord.Permissions.FLAGS.SEND_MESSAGES, handler: async function(msg, args) {
        var guild = msg.guild;
        await self.checkDbInit(guild);
        
        sqlite.db[guild.id].all("SELECT * FROM rss WHERE name = $name",{"$name": args[0]}, function(err,rows) {
            if(err) {
                msg.channel.send("Could not load feed. :( See console.");
                console.log("SQL ERROR: ",err);
                return;
            }
            if(rows.length < 1) {
                msg.channel.send("I didn't find "+args[0]+" in database. Add it with !rssadd.");
                return;
            }
            var row = rows[0];
            msg.channel.send("Name: "+args[0]+" channel: "+row.channel+" url: "+row.url);
        });
    }});
};

exports.fetch = function(abot) {
    return new rss(abot);
};