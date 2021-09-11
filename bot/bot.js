const Discord = require("discord.js");
const fs = require("fs");
var https = require("https");
const client = new Discord.Client();
const blankMsg = new Discord.Message();
let commands = new Map();
const server = require("./server");
const app = server.server;

fs.readdir("./commands", (err, files) => {
  files.forEach((f) => {
    let props = require(`./commands/` + f);
    commands.set(props.name, props);
  });
});

client.on("ready", async () => {
  app.listen(44038);
  var user = await client.users.fetch("853312194929360986");
  console.log(user);
  console.log("ЗДАРОВА Я ПРОСНУЛСЯ");
});
client.on("message", async (msg) => {
  if (msg.content.startsWith("..")) {
    let data = msg.content.slice(2).split(" ");
    let args = data.slice(1).join(" ");
    if (commands.has(data[0])) commands.get(data[0]).run(client, msg, args);
  }
});
client.on("voiceStateUpdate", (vsold, vsnew) => {
  if (vsold.channel) if (vsold.channel.members.size == 1) vsold.channel.leave();
});

client.login("ODY1NzA5NzI4NDI4MDY0NzY4.YPH9Aw.VLet4TDuy_X7N4QwAxqZNiC2ano");
