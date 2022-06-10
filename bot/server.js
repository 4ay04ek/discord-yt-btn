const express = require("express");
const { urlencoded, response } = require("express");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const app = express();
const log = require('./errorHandler').log;
var cookies = new Map();

var banned = []

try {

fs.readFile("users.txt", "utf-8", (err, file) => {
  file.split("\r\n").forEach((el) => {
    cookies.set(el.split("|")[0], { access_token: el.split("|")[1], refresh_token: el.split("|")[2] });
  });
});

var updateFile = (data) => {
  fs.writeFile("users.txt", "", () => {});
  data.forEach((v, k) => {
    if (k != "") fs.appendFile("users.txt", `${k}|${v.access_token}|${v.refresh_token}\r\n`, () => {});
  });
};

app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post("/", (req, res) => {
  console.log(req.body);
});

app.get("/refresh", (req, res) => {
  var my_token = req.query.token;
  axios({
    method: "post",
    url: "https://discord.com/api/oauth2/token",
    data:
      "client_id=865709728428064768&client_secret=vhaTOf08hpAaSV-iJBO4JLRY41t-Kom2&grant_type=refresh_token&refresh_token=" +
      cookies.get(my_token).refresh_token +
      "&redirect_uri=http%3A%2F%2F5.228.43.243%3A44038%2Fauth",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).then((res) => {
    cookies.set(my_token, {
      access_token: res.data.token_type + " " + res.data.access_token,
      refresh_token: res.data.refresh_token,
    });
    updateFile(cookies);
  }).catch(e => {
    log("E", e);
  });
  log("I", "User's " + my_token + " access_token refreshed");
  res.send(cookies.get(my_token).access_token);
});

app.get("/redirect", (req, res) => {
  if (banned.includes(req.query.token)) res.send("ВЫКИНЬ КОМПЬЮТЕР В ОКНО БЫДЛО")
  else {
    res.cookie("token", req.query.token);
    if (req.query.url.includes("chrome://")) res.cookie("url", "https://www.youtube.com/");
    else res.cookie("url", req.query.url);
    res.redirect(
      "https://discord.com/api/oauth2/authorize?client_id=865709728428064768&redirect_uri=http%3A%2F%2F5.228.43.243%3A44038%2Fauth&response_type=code&scope=identify%20guilds%20messages.read"
    );
  }
});
app.get("/auth", (req, res) => {
  axios({
    method: "post",
    url: "https://discord.com/api/oauth2/token",
    data:
      "client_id=865709728428064768&client_secret=vhaTOf08hpAaSV-iJBO4JLRY41t-Kom2&grant_type=authorization_code&code=" +
      req.query.code +
      "&redirect_uri=http%3A%2F%2F5.228.43.243%3A44038%2Fauth",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).then((res) => {
    cookies.set(req.cookies["token"], {
      access_token: res.data.token_type + " " + res.data.access_token,
      refresh_token: res.data.refresh_token,
    });
    updateFile(cookies);
    log("I", "New user " + req.cookies["token"] + " from " + req.socket.remoteAddress);
  }).catch(e => {
    log("E", e);
  });
  res.redirect(req.cookies["url"]);
});
app.get("/user", (req, res) => {
  if (cookies.has(req.query.token)) res.send(cookies.get(req.query.token).access_token);
  else {
    res.send("Unauthorized");
  }
});
app.get("/blank", (req, res) => {
  res.sendFile(__dirname + "blank.html");
});

module.exports.server = app;

} catch (e) {
  log("E", e);
}
