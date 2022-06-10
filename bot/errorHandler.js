const fs = require("fs");

module.exports.log = (type, e) => {
    var time = (new Date()).toLocaleDateString() + "|" + (new Date()).getHours() + ":" + (new Date()).getMinutes() + ":" + (new Date()).getSeconds();
    fs.appendFile("log.txt", `[${type}](${time}): ${e}\r\n`, () => {});
}