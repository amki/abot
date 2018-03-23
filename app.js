// Load up the discord.js library
const Discord = require("discord.js");
const config = require("./config.json");
const fs = require('fs');
const path = require('path');

var ABot = function() {
    self = this;

    self.config = config;

    self.modules = {};
    self.client = new Discord.Client();
    
    self.reloadModules().then(function() {
        self.client.login(config.token);
    });
};

ABot.prototype.loadModule = async function(moduleName) {
    console.log("Trying to load "+moduleName);
    if(self.modules[moduleName]) {
        console.log("Module already loaded.");
        return true;
    }
    var modulePath = path.join("./modules/",moduleName);
    var moduleConfig = {};
    var configPath = path.join(modulePath, "config.json");
    if(fs.existsSync(configPath)) {
        try {
            moduleConfig = JSON.parse(fs.readFileSync(configPath));
        } catch(err) {
            console.log('Error parsing config: ' + err + ' ' + err.stack);
            return false;
        }
    }

    if(moduleConfig.dependencies && moduleConfig.dependencies.length > 0) {
        console.log("Found dependencies for "+moduleName);
        for(var i=0;i< moduleConfig.dependencies.length;++i) {
            var dep = moduleConfig.dependencies[i];
            var lMods = Object.keys(self.modules);
            if(!lMods.includes(dep)) {
                console.log("Dependency "+dep+" unmet, loading...");
                if(!await self.reloadModule(dep)) {
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
        self.modules[moduleName] = module;
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

