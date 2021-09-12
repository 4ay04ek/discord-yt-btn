const express = require("express");
const { urlencoded, response } = require("express");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const app = express();
var cookies = new Map();

app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/play", (req, res) => {
  commands.get("play").run(client, blankMsg, req.query.url);
});
app.post("/", (req, res) => {
  console.log(req.body);
});
app.get("/redirect", (req, res) => {
  res.cookie("token", req.query.token);
  res.redirect(
    "https://discord.com/api/oauth2/authorize?client_id=865709728428064768&redirect_uri=http%3A%2F%2Flocalhost%3A44038%2Fauth&response_type=code&scope=identify%20guilds"
  );
});
app.get("/auth", (req, res) => {
  axios({
    method: "post",
    url: "https://discord.com/api/oauth2/token",
    data:
      "client_id=865709728428064768&client_secret=vhaTOf08hpAaSV-iJBO4JLRY41t-Kom2&grant_type=authorization_code&code=" +
      req.query.code +
      "&redirect_uri=http%3A%2F%2Flocalhost%3A44038%2Fauth",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).then((res) => {
    cookies.set(req.cookies["token"], res.data.token_type + " " + res.data.access_token);
  });
  res.send("<script>window.close();</script>");
});
app.get("/user", (req, res) => {
  if (cookies.has(req.query.token)) res.send(cookies.get(req.query.token));
  else {
    res.send("Unauthorized");
  }
});
app.get("/blank", (req, res) => {
  res.sendFile(__dirname + "blank.html");
});

module.exports.server = app;
