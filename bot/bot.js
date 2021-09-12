const Discord = require("discord.js");
const fs = require("fs");
var https = require("https");
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILD_VOICE_STATES, Discord.Intents.FLAGS.GUILDS],
});
let commands = new Map();
const server = require("./server");
const app = server.server;

app.get("/play", (req, res) => {
  const user_guilds = server.user_guilds;
  const user_id = server.user_id;
  console.log(user_guilds);
  console.log(user_id);
});

fs.readdir("./commands", (err, files) => {
  files.forEach((f) => {
    let props = require(`./commands/` + f);
    commands.set(props.name, props);
  });
});

client.on("ready", async () => {
  app.listen(44038);
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

client.login("ODY1NzA5NzI4NDI4MDY0NzY4.YPH9Aw.MGbc-qWz_IbedL87L2BOAaYo8pk");
