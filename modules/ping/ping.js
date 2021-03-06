const Discord = require('discord.js');

var ping = function(abot) {
    console.log("Started ping!");
    var command = abot.modules["command"];
    abot.addCommand({command: "ping", access: Discord.Permissions.FLAGS.SEND_MESSAGES, handler: async function(msg, args) {
        const m = await msg.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - msg.createdTimestamp}ms. API Latency is ${Math.round(abot.client.ping)}ms`);
        msg.channel.send("This command was sent by: "+msg.author.tag);
    }});
    
    abot.addCommand({command: "echo", access: "", handler: async function(msg, args) {
        const m = await msg.channel.send("Echo: "+msg.content.slice(abot.config.prefix.length).trim());
        console.log("Echo: "+msg.content.slice(abot.config.prefix.length).trim());
    }});
    
    abot.addCommand({command: "say", access: Discord.Permissions.FLAGS.KICK_MEMBERS,handler: async function(msg, args) {
        // makes the bot say something and delete the message. As an example, it's open to anyone to use.
        // To get the "message" itself we join the `args` back into a string with spaces:
        const sayMessage = args.join(" ");
        // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
        msg.delete().catch(O_o=>{});
        // And we get the bot to say the thing:
        msg.channel.send(sayMessage);
    }});
    abot.addCommand({command: "deny", access: Discord.Permissions.FLAGS.KICK_MEMBERS, handler: async function(msg, args) {
        msg.channel.send("You should now have been able to do this... How did you break me?");
    }});
}

exports.fetch = function(abot) {
    return new ping(abot);
}
