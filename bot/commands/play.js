const Discord = require("discord.js");
const ytdl = require("discord-ytdl-core");
const axios = require("axios");
const log = require('../errorHandler').log;

let songs = [];
let connection;
var disp;
var repeatState = 0;
var skip = false;

function getParameterByName(name, url) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function next() {
  if (repeatState == 0 || (repeatState == 2 && skip)) songs.shift();
  if (repeatState == 1) {
    songs.push(songs[0]);
    songs.shift();
  }
  if (songs.length > 0) {
    disp = connection.play(ytdl(songs[0], {opusEncoded: true, filter: "audioonly", highWaterMark: 1 << 25}), {type: "opus"}).on("finish", () => {
      next();
    });
  } else {
      connection?.disconnect();
  }
  skip = false;
}

async function play(url) {
  disp = connection.play(ytdl(url, {opusEncoded: true, filter: "audioonly", highWaterMark: 1 << 25}), {type: "opus"}).on("finish", () => {
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
    let videoId = getParameterByName('v', songs[0]);
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

var timeParser = (time) => {
  time.replace('PT', '');
  var result = ''
  var afterNum = false;
  for (var i = 0; i < time.length; i++) {
    if (time.charAt(i) <= '9' && time.charAt(i) >= '0'){
      result += time.charAt(i);
      afterNum = true;
    } else if (afterNum){
      result += ':';
      afterNum = false;
    }
  }
  return result.slice(0, -1);
}

module.exports.run = async (client, msg, arg) => {
  if (msg.member.voice.channel) {
    if (arg.indexOf("https://www.youtube.com") == -1) {
      let q = encodeURI(arg);
      axios
        .get(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU&maxResults=5`
        )
        .then(async (res) => {
          let result = [];
          for (var item of res.data.items) {
            var response = (await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${item.id.videoId}&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`)).data
            if (response.pageInfo.totalResults) var time = response.items[0].contentDetails;
            else return;
            var vd = {};
            vd['id'] = item.id.videoId;
            vd['title'] = item.snippet.title;
            vd['duration'] = timeParser(time.duration);
            result.push(vd);
          };
          let ans = "";
          for (let i = 0; i < 5; i += 1) {
            ans += `${i + 1}. ${result[i].title} (${result[i].duration})\n`;
          }
          msg.channel.send(ans);
          var listener = async (msg) => {
            if (msg.content.startsWith("..")) {
              if (msg.content.slice(2) >= "1" && msg.content.slice(2) <= "5") {
                connection = await msg.member.voice.channel.join();
                if (songs.length == 0) {
                  play("https://www.youtube.com/watch?v=" + result[parseInt(msg.content.slice(2)) - 1].id);
                }
                songs.push("https://www.youtube.com/watch?v=" + result[parseInt(msg.content.slice(2)) - 1].id);
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
      var playlistId = getParameterByName("list", arg);
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
  arg.replace('music.', '');
    connection = await member.voice.channel.join();
      if (arg.indexOf("watch?v=") == -1 && arg.indexOf("list=") != -1) {
      var playlistId = getParameterByName("list", arg);
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
        }).catch(e => {
          log("E", e);
        });
      return;
    }
    if (songs.length == 0) {
      play(arg);
    }
    if (!songs.includes(arg)) songs.push(arg);
};

module.exports.setTime = async (time) => {
  disp = connection.play(ytdl(songs[0], {seek: time, opusEncoded: true, filter: "audioonly", highWaterMark: 1 << 25}), {type: "opus"}).on("finish", () => {
    next();
  });
}

module.exports.state = () => {
  if (songs.length > 0) return { time: disp?.streamTime, url: songs[0], repeatState: repeatState };
  else return "chill";
};

module.exports.queue = () => {
  return songs;
};

module.exports.repeatState = (state) => {
  repeatState = state;
};

module.exports.getNext = () => {
  if (songs.length > 0) return { url: songs[0] };
  else return "chill";
};

module.exports.name = "play";