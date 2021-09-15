const Discord = require("discord.js");
const fs = require("fs");
var https = require("https");
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
let commands = new Map();
const server = require("./server");
const axios = require("axios");
const runFromYT = require("./commands/play").runFromYT;
const time = require("./commands/play").time;
const app = server.server;

fs.readdir("./commands", (err, files) => {
  files.forEach((f) => {
    let props = require(`./commands/` + f);
    commands.set(props.name, props);
  });
});

app.post("/play", (req, res) => {
  var user;
  var guilds;
  axios({
    method: "get",
    url: "https://discord.com/api/users/@me",
    headers: {
      authorization: req.body.token,
    },
  }).then((response) => {
    axios({
      method: "get",
      url: "https://discord.com/api/users/@me/guilds",
      headers: {
        authorization: req.body.token,
      },
    }).then((res) => {
      user = response.data.id;
      guilds = res.data;
      guilds.forEach(async (guild) => {
        var guild_info;
        try {
          guild_info = await client.guilds.fetch(guild.id);
        } catch (e) {}
        if (guild_info != undefined) {
          var channels = await guild_info.channels.cache;
          channels.forEach((channel) => {
            if (channel.type == "voice") {
              channel.members.forEach((member) => {
                if (member.user.id == user) {
                  runFromYT(client, member, req.body.url);
                }
              });
            }
          });
        }
      });
    });
  });
});

app.get("/time", (req, res) => {
  res.send({ time: time() });
});

app.post("/skip", (req, res) => {
  commands.get("skip").run();
});

app.post("/getPlay", (req, res) => {
  commands.get("skip").run();
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

client.login("");
