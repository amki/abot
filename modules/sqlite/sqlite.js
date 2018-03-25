const sqlite3 = require('sqlite3').verbose();

var sqlite = function(abot) {
    var self = this;
    console.log("Started sqlite!");
    self.db = {};
    //
    self.openAllDbs = function() {
        var guilds = abot.client.guilds.array();
        for(var i=0;i<guilds.length;++i) {
            var guild = guilds[i];
            self.openDb(guild.id);
        }
    };
    self.openDb = function(id) {
        self.db[id] = new sqlite3.Database(id+'.sqlite');
    };
    self.openAllDbs();
};

exports.fetch = function(abot) {
    return new sqlite(abot);
};
