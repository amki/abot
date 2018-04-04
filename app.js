// Load up the discord.js library
const Discord = require("discord.js");
const config = require("./config.json");
const fs = require('fs');
const path = require('path');

var ABot = function() {
    self = this;

    self.config = config;

    self.modules = {};
    self.commands = {};
    self.helps = {};
    self.client = new Discord.Client();

    self.initHelp().then(function() {
        self.reloadModules().then(function() {
            self.client.login(config.token);
        });
    });
};

ABot.prototype._getCallerFile = function() {
    var originalFunc = Error.prepareStackTrace;

    var callerfile;
    try {
        var err = new Error();
        var currentfile;

        Error.prepareStackTrace = function (err, stack) { return stack; };

        currentfile = err.stack.shift().getFileName();

        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();

            if(currentfile !== callerfile) break;
        }
    } catch (e) {}

    Error.prepareStackTrace = originalFunc; 

    return callerfile;
};

ABot.prototype.initHelp = async function() {
    self.addCommand({command: "help", access: Discord.Permissions.FLAGS.SEND_MESSAGES, handler: async function(msg, args) {
        if(args.length == 0) {
            msg.channel.send("Complete help NYI");
        } else if(args.length == 1) {
            var helpObj = self.helps[args[0]];
            if(helpObj == null) {
                msg.channel.send("I don't know anything about "+args[0]);
                return;
            }
            if(helpObj.usage != null) {
                msg.channel.send("Usage: "+helpObj.usage);
            }
            if(helpObj.sHelp != null) {
                msg.channel.send(helpObj.sHelp);
            }
        }
    }});
};

ABot.prototype.initCommand = async function() {
    var self = this;
    self.client.on("message", async message => {
        if(message.content.indexOf(self.config.prefix) !== 0) return;
        const args = message.content.slice(self.config.prefix.length).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();

        var cmdList = Object.keys(self.commands);
        if(cmdList.includes(cmd)) {
            var cmdObj = self.commands[cmd];
            if(message.member.permissions.has(cmdObj.access)) {
                var helpObj = self.helps[cmd];
                if(cmdObj.argCount != null && args.length < cmdObj.argCount) {
                    if(helpObj != null && helpObj.usage != null) {
                        message.channel.send("Usage: "+helpObj.usage);
                    } else {
                        message.channel.send("ERROR: Command needs more arguments.");
                    }
                    return;
                }
                cmdObj.handler(message, args);
            } else {
                message.channel.send("I'm sorry "+message.author+", I'm afraid I can't do that.");
            }
        }
    });
};

ABot.prototype.addCommand = async function(cmdObj) {
    var self = this;
    var callerpath = path.parse(self._getCallerFile());
    var splits = callerpath.dir.split(path.sep);
    // Folder following modules/ is the module name see module loading
    var idx = splits.indexOf("modules");
    var moduleName = "";
    if(idx != -1) {
        moduleName = splits[splits.indexOf("modules")+1];
    } else {
        moduleName = "core";
    }
    cmdObj.parentModule = moduleName;
	if(!cmdObj.command || cmdObj.access == null || !cmdObj.handler) {
		console.log("Command: Error adding command "+command+" you have to specify command, access and handler");
		return;
	}
	self.commands[cmdObj.command] = cmdObj;
}

ABot.prototype.loadModule = async function(moduleName) {
    console.log("Trying to load "+moduleName);
    if(self.modules[moduleName]) {
        console.log("Module already loaded.");
        return true;
    }
    var modulePath = path.join("./modules/",moduleName);
    var moduleConfig = {};
    var moduleHelp = {};
    var configPath = path.join(modulePath, "config.json");
    var helpPath = path.join(modulePath, "help.json");

    // Load config
    if(fs.existsSync(configPath)) {
        try {
            moduleConfig = JSON.parse(fs.readFileSync(configPath));
        } catch(err) {
            console.log('Error parsing config: ' + err + ' ' + err.stack);
            return false;
        }
    }
    
    // Load helps
    if(fs.existsSync(helpPath)) {
        try {
            moduleHelp = JSON.parse(fs.readFileSync(helpPath));
        } catch(err) {
            console.log('Error parsing help: ' + err + ' ' + err.stack);
            return false;
        }
    }
    var k = Object.keys(moduleHelp);
    for(var i=0;i<k.length;++i) {
        var helpObj = moduleHelp[k];
        console.log("Loading help for "+k);
        self.helps[k] = helpObj;
    }
    if(moduleConfig.dependencies && moduleConfig.dependencies.length > 0) {
        console.log("Found dependencies for "+moduleName);
        for(var i=0;i< moduleConfig.dependencies.length;++i) {
            var dep = moduleConfig.dependencies[i];
            var lMods = Object.keys(self.modules);
            if(!lMods.includes(dep)) {
                console.log("Dependency "+dep+" unmet, loading...");
                if(!await self.loadModule(dep)) {
                    console.log("Not loading "+moduleName+" because of dependency failure.");
                    return false;
                };
            }
        }
    }
    
    // Load new version
    try {
        var rawModule = require("./" + modulePath + "/" + moduleName);
        var module = rawModule.fetch(this);
        module.name = moduleName;
        module.config = moduleConfig;
        if(module.onCreate)
            module.onCreate();
        self.modules[moduleName] = module;
        return true;
    } catch(err) {
        console.log('Error loading module: '+err.stack);
        return false;
    }

};

ABot.prototype.reloadModules = async function() {
    var self = this;

    var eventNames = self.client.eventNames();
    for(var i=0;i<eventNames.length;++i) {
        if(!eventNames[i].startsWith("self.")) {
            self.client.removeAllListeners(eventNames[i]);
        }
    }
    console.log("Reload removed all listeners.");
    self.initCommand();
    
    var eventNames = self.client.eventNames();
    for(var i=0;i<eventNames.length;++i) {
        console.log(eventNames[i]+": "+self.client.listenerCount(eventNames[i]));
    }

    var loadedMods = Object.keys(self.modules);
    for(var i=0;i<loadedMods.length;++i) {
        var mod = self.modules[loadedMods[i]];
        if(mod)
            if(mod.onDestroy)
                mod.onDestroy();
    }

    self.moduleNames = fs.readdirSync("./modules");
    // Unload all modules
    for(var i=0;i<self.moduleNames.length;++i) { 
        var moduleName = self.moduleNames[i];
        var modulePath = path.join("./modules/",moduleName);
        if(self.modules[moduleName]) {
            // Remove cached module
            try {
                var cacheKey = require.resolve("./" + modulePath + "/" + moduleName);
                delete require.cache[cacheKey];
            } catch(err) {
                console.log('Error loading module: ' + err + ' ' + err.stack);
                return false;
            }
        }
    }
    self.modules = {};
    // Load all modules
    for(var i=0;i<self.moduleNames.length;++i) { 
        var moduleName = self.moduleNames[i];
        await self.loadModule(moduleName);
    }
};

new ABot();

