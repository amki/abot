const sqlite3 = require('sqlite3').verbose();

var sqlite = function(abot) {
    var self = this;
    console.log("Started sqlite!");
    self.db = new sqlite3.Database('abot.sqlite');
    //
};

exports.fetch = function(abot) {
    return new sqlite(abot);
};
