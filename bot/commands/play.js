const Discord = require("discord.js");
const ytdl = require("ytdl-core-discord");
const axios = require("axios");

let songs = [];
let connection;
var disp;
var repeatState = 0;
var skip = false;

async function next() {
  if (repeatState == 0 || (repeatState == 2 && skip)) songs.shift();
  if (repeatState == 1) {
    songs.push(songs[0]);
    songs.shift();
  }
  if (songs.length > 0) {
    disp = connection.play(await ytdl(songs[0], { highWaterMark: 1 << 25 }), { type: "opus" }).on("finish", () => {
      next();
    });
  } else {
    connection.disconnect();
  }
  skip = false;
}

async function play(url) {
  disp = connection.play(await ytdl(url, { highWaterMark: 1 << 25 }), { type: "opus" }).on("finish", () => {
    next();
  });
}

module.exports.flush = () => {
  songs = [];
};

module.exports.skip = () => {
  skip = true;
  next();
};

module.exports.lyrics = (msg, arg) => {
  let title = arg;
  if (arg === "") {
    if (songs.length == 0) {
      msg.channel.send("Включите трек или напишите название");
    }
    let videoId = songs[0].substring(32, 43);
    axios
      .get(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
      )
      .then((res) => {
        title = res.data.items[0].snippet.title;
        axios
          .get("https://some-random-api.ml/lyrics?title=" + encodeURI(title))
          .then((response) => {
            msg.channel.send(response.data.lyrics.substring(0, Math.min(response.data.lyrics.length, 2000)));
          })
          .catch((e) => {
            msg.channel.send("Не нашлось");
          });
      });
  } else {
    axios
      .get("https://some-random-api.ml/lyrics?title=" + encodeURI(title))
      .then((response) => {
        if (response.data.lyrics.length > 2000) {
          for (let i = 0; i < response.data.lyrics.length; i += 2000) {
            msg.channel.send(response.data.lyrics.substring(i, i + 2000));
          }
        } else {
          msg.channel.send(response.data.lyrics);
        }
      })
      .catch((e) => {
        msg.channel.send("Не нашлось");
      });
  }
};

module.exports.run = async (client, msg, arg) => {
  if (msg.member.voice.channel) {
    if (arg.indexOf("https://www.youtube.com") == -1) {
      let q = encodeURI(arg);
      axios
        .get(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU&maxResults=5`
        )
        .then((res) => {
          let resultTitles = [];
          let resultVideos = [];
          res.data.items.forEach((item) => {
            resultVideos.push(item.id.videoId);
            resultTitles.push(item.snippet.title);
          });
          let ans = "";
          for (let i = 1; i <= 5; i += 1) {
            ans += `${i}. ${resultTitles[i - 1]}\n`;
          }
          msg.channel.send(ans);
          var listener = async (msg) => {
            if (msg.content.startsWith("..")) {
              if (msg.content.slice(2) >= "1" && msg.content.slice(2) <= "5") {
                connection = await msg.member.voice.channel.join();
                if (songs.length == 0) {
                  play("https://www.youtube.com/watch?v=" + resultVideos[parseInt(msg.content.slice(2)) - 1]);
                }
                songs.push("https://www.youtube.com/watch?v=" + resultVideos[parseInt(msg.content.slice(2)) - 1]);
                client.removeListener("message", listener);
              }
            }
          };
          client.on("message", listener);
        });
      return;
    }
    connection = await msg.member.voice.channel.join();
    if (arg.indexOf("&list=") != -1) {
      var playlistId = arg.substring(arg.indexOf("&list=") + 6);
      axios
        .get(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=1000&playlistId=${playlistId}&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
        )
        .then((res) => {
          let videos = res.data.items;
          play("https://www.youtube.com/watch?v=" + videos[0].contentDetails.videoId);
          videos.forEach((video) => {
            songs.push("https://www.youtube.com/watch?v=" + video.contentDetails.videoId);
          });
        });
      return;
    }
    if (songs.length == 0) {
      play(arg);
    }
    songs.push(arg);
  } else {
    msg.reply("дурачок ЗАЙДИ В КАНАЛ СНАЧАЛА");
  }
};

module.exports.runFromYT = async (client, member, arg) => {
  connection = await member.voice.channel.join();
  if (songs.length == 0) {
    play(arg);
  }
  songs.push(arg);
};

module.exports.state = () => {
  if (songs.length > 0) return { time: disp?.streamTime, url: songs[0], repeatState: repeatState };
  else return "chill";
};

module.exports.repeatState = (state) => {
  repeatState = state;
};

module.exports.getNext = () => {
  if (songs.length > 0) return { url: songs[0] };
  else return "chill";
};

module.exports.name = "play";
