var ping = function(abot) {
    console.log("Loaded ping!");
    console.log("ping: abot modules: ",abot.modules);
    var command = abot.modules["command"];
    abot.client.on("message", async message => {
      // This event will run on every single message received, from any channel or DM.

      // It's good practice to ignore other bots. This also makes your bot ignore itself
      // and not get into a spam loop (we call that "botception").
      //if(message.author.bot) return;

      // Also good practice to ignore any message that does not start with our prefix,
      // which is set in the configuration file.
      if(message.content.indexOf(abot.config.prefix) !== 0) return;

      // Here we separate our "command" name, and our "arguments" for the command.
      // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
      // command = say
      // args = ["Is", "this", "the", "real", "life?"]
      const args = message.content.slice(abot.config.prefix.length).trim().split(/ +/g);
      const cmd = args.shift().toLowerCase();

      // Let's go with a few common example commands! Feel free to delete or change those.

      if(cmd === "ping") {
        // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
        // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
        const m = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(abot.client.ping)}ms`);
        message.channel.send("This command was sent by: "+message.author.tag);
      }

      if(cmd === "echo") {
          const m = await message.channel.send("Echo: "+message.content.slice(abot.config.prefix.length).trim());
          console.log("Echo: "+message.content.slice(abot.config.prefix.length).trim());
      }

      if(cmd === "debug") {
        command.debug(message.channel);
      }


      if(cmd === "say") {
        // makes the bot say something and delete the message. As an example, it's open to anyone to use.
        // To get the "message" itself we join the `args` back into a string with spaces:
        const sayMessage = args.join(" ");
        // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
        message.delete().catch(O_o=>{});
        // And we get the bot to say the thing:
        message.channel.send(sayMessage);
      }
    });

}

exports.fetch = function(abot) {
    return new ping(abot);
}
