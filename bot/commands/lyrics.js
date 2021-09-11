const Discord = require("discord.js");
const playManager = require("./play");

module.exports.run = async (client, msg, arg) => {
  playManager.lyrics(msg, arg);
};

module.exports.name = "lyrics";
