var base = function(abot) {
    console.log("Loaded base!");
    var command = abot.modules["command"];
    var sqlite = abot.modules["sqlite"];

    abot.client.on("ready", () => {
      // This event will run if the bot starts, and logs in, successfully.
      console.log(`Bot has started, with ${abot.client.users.size} users, in ${abot.client.channels.size} channels of ${abot.client.guilds.size} guilds.`);
      // Example of changing the bot's playing game to something useful. `client.user` is what the
      // docs refer to as the "ClientUser".
      abot.client.user.setActivity(`on ${abot.client.guilds.size} servers`);
        abot.modules["sqlite"].openAllDbs();
    });

    abot.client.on("guildCreate", guild => {
      // This event triggers when the bot joins a guild.
      console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
      abot.client.user.setActivity(`on ${abot.client.guilds.size} servers`);
    });

    abot.client.on("guildDelete", guild => {
      // this event triggers when the bot is removed from a guild.
      console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
      abot.client.user.setActivity(`on ${abot.client.guilds.size} servers`);
    });

    command.addCommand({command: "reload", access: "admin", handler: async function(msg, args) {
        await msg.channel.send("Reloading all modules...");
        await abot.reloadModules();
        msg.channel.send("Modules reloaded!");
    }});
}

exports.fetch = function(abot) {
    return new base(abot);
}
