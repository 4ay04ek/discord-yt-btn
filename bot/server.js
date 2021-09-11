const express = require("express");
const { urlencoded } = require("express");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const app = express();
var code = "";

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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).then((res) => {
    console.log(res);
  });
  res.send(200);
});

module.exports.server = app;
