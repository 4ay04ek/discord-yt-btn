const express = require("express");
const { urlencoded } = require("express");
const { default: axios } = require("axios");
const app = express();
var code = "";

app.use(express.json());
app.use(urlencoded({ extended: true }));

app.get("/play", (req, res) => {
  commands.get("play").run(client, blankMsg, req.query.url);
});
app.post("/", (req, res) => {
  console.log(req.body);
});
app.get("/blank", (req, res) => {
  code = req.query.code;
  res.sendFile(__dirname + "/blank.html");
});

module.exports.server = app;
