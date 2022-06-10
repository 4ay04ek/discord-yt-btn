const Discord = require("discord.js");
const fs = require("fs");
var https = require("https");
const client = new Discord.Client();
let commands = new Map();
const server = require("./server");
const axios = require("axios");
const runFromYT = require("./commands/play").runFromYT;
const setTime = require("./commands/play").setTime;
const getState = require("./commands/play").state;
const getQueue = require("./commands/play").queue;
const setRepeatState = require("./commands/play").repeatState;
const next = require("./commands/play").getNext;
const log = require('./errorHandler').log;
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
        } catch (e) {log("E", e);}
        if (guild_info != undefined) {
          var channels = guild_info.channels.cache;
          channels.forEach((channel) => {
            if (channel.type == "voice") {
              channel.members.forEach((member) => {
                if (member.user.id == user) {
                  log("I", "Trying to play: " + req.body.url);
                  runFromYT(client, member, req.body.url);
                }
              });
            }
          });
        }
      });
    }).catch(e => {
      log("E", e);
    });
  }).catch(e => {
    log("E", e);
  });
});

app.post("/playtime", (req, res) => {
  setTime(req.body.time);
});

app.get("/state", (req, res) => {
  res.send(getState());
});

app.get("/queue", (req, res) => {
  res.send(getQueue());
});

app.post("/skip", async (req, res) => {
  commands.get("skip").run();
  res.send(next());
});

app.post("/repeat", (req, res) => {
  setRepeatState(req.body.state);
});

client.on("ready", async () => {
  app.listen(44038);
  console.log("ЗДАРОВА Я ПРОСНУЛСЯ");
});

client.on("message", async (msg) => {
  if (msg.content == "..fix"){
     msg.guild.members.fetch(client.user.id).then(bot => {
        bot.setNickname("cringebot");
     })
  }
  if (msg.content.startsWith("..")) {
    let data = msg.content.slice(2).split(" ");
    let args = data.slice(1).join(" ");
    if (commands.has(data[0])) commands.get(data[0]).run(client, msg, args);
  }
});
client.on("voiceStateUpdate", (vsold, vsnew) => {
  if (vsold.channel)
    if (vsold.channel.members.size == 1) {
      vsold.channel.leave();
    }
});
client.login("ODY1NzA5NzI4NDI4MDY0NzY4.YPH9Aw.a6offFpVjKkEVvR3FVaEpy86j0o");
