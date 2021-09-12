const express = require("express");
const { urlencoded, response } = require("express");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const app = express();
var user_id;
var user_guilds = [];

app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

app.get("/play", (req, res) => {
  commands.get("play").run(client, blankMsg, req.query.url);
});
app.post("/", (req, res) => {
  console.log(req.body);
});
app.get("/blank", (req, res) => {
  axios({
    method: "post",
    url: "https://discord.com/api/oauth2/token",
    data:
      "client_id=865709728428064768&client_secret=vhaTOf08hpAaSV-iJBO4JLRY41t-Kom2&grant_type=authorization_code&code=" +
      req.query.code +
      "&redirect_uri=http%3A%2F%2Flocalhost%3A44038%2Fblank",
  }).then((res) => {
    axios({
      method: "get",
      url: "https://discord.com/api/users/@me",
      headers: {
        authorization: res.data.token_type + " " + res.data.access_token,
      },
    }).then((res) => {
      user_id = res.data.id;
    });
    axios({
      method: "get",
      url: "https://discord.com/api/users/@me/guilds",
      headers: {
        authorization: res.data.token_type + " " + res.data.access_token,
      },
    }).then((res) => {
      res.data.forEach((el) => {
        user_guilds.push(el.id);
      });
      console.log(user_guilds);
    });
  });
  res.sendStatus(200);
});

module.exports.server = app;
module.exports.user_guilds = user_guilds;
module.exports.user_id = user_id;
