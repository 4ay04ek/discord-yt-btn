const Discord = require("discord.js");
const playManager = require("./play");

module.exports.run = async (client, msg, arg) => {
  await msg.guild.me.voice.channel.leave();
  playManager.flush();
};

module.exports.name = "stop";
