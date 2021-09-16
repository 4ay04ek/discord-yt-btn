var url;
var timer;

function getParameterByName(name, url) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function drawInfo(time, playUrl) {
  var id = getParameterByName("v", playUrl);
  var r = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=snippet&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
  );
  document.getElementById("info").removeAttribute("hidden");
  var imgtypes = r.data.items[0].snippet.thumbnails;
  document.getElementById("preview").src = imgtypes[Object.keys(imgtypes)[Object.keys(imgtypes).length - 1]].url;
  document.getElementById("title").textContent = r.data.items[0].snippet.title;
  var r = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=contentDetails&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
  );
  var r_duration = r.data.items[0].contentDetails.duration;
  var minutes, seconds;
  if (r_duration.includes("M")) {
    minutes = r_duration.substring(r_duration.indexOf("PT") + 2, r_duration.indexOf("M"));
    seconds = r_duration.substring(r_duration.indexOf("M") + 1, r_duration.indexOf("S"));
  } else {
    minutes = 0;
    seconds = r_duration.substring(r_duration.indexOf("PT") + 2, r_duration.indexOf("S"));
  }
  time /= 1000;
  timer = setInterval(() => {
    document.getElementById("time").textContent =
      moment({ m: time / 60, s: time % 60 }).format("m:ss") + " / " + moment({ m: minutes, s: seconds }).format("m:ss");
    time += 1;
    if (time >= parseInt(minutes * 60) + parseInt(seconds)) {
      document.getElementById("info").setAttribute("hidden", true);
      clearInterval(timer);
      axios.get("http://5.228.43.243:44038/state").then((state) => {
        if (state.data != "chill") drawInfo(state.data.time, state.data.url);
      });
    }
  }, 1000);
}

async function withAuthRenderer(avatar, username, discriminator, token) {
  document.body.innerHTML = "";
  var parser = new DOMParser();
  var r = await fetch("/withAuth.html");
  var doc = parser.parseFromString(await r.text(), "text/html");
  doc.getElementById("avatar").src = avatar;
  doc.getElementById("name").textContent = username;
  doc.getElementById("dis").textContent = "#" + discriminator;
  document.body.appendChild(doc.getElementById("maindiv"));
  var state = await axios.get("http://5.228.43.243:44038/state");
  var repeatState = 0;
  if (state.data != "chill") {
    repeatState = state.data.repeatState;
    if (repeatState == 1) document.getElementById("repeat").src = "src/repeat.png";
    if (repeatState == 2) document.getElementById("repeat").src = "src/repeat_single.png";
  }
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var activeTab = tabs[0];
    if (activeTab.url.includes("youtube.com/watch")) {
      document.getElementById("play").removeAttribute("hidden");
      document.getElementById("play").onclick = async () => {
        if (state.data == "chill") drawInfo(0, activeTab.url);
        axios.post("http://5.228.43.243:44038/play", { url: activeTab.url, token: token });
      };
    }
  });
  document.getElementById("repeat").onclick = () => {
    repeatState += 1;
    if (repeatState == 1) document.getElementById("repeat").src = "src/repeat.png";
    if (repeatState == 2) document.getElementById("repeat").src = "src/repeat_single.png";
    if (repeatState == 3) {
      document.getElementById("repeat").src = "src/norepeat.png";
      repeatState = 0;
    }
    axios.post("http://5.228.43.243:44038/repeat", { state: repeatState });
  };
  document.getElementById("skip").onclick = () => {
    axios.post("http://5.228.43.243:44038/skip").then((res) => {
      if (res.data != "chill") {
        drawInfo(0, res.data.url);
        clearInterval(timer);
      } else document.getElementById("info").setAttribute("hidden", true);
    });
  };
  if (state.data != "chill") drawInfo(state.data.time, state.data.url);
}

function withoutAuthRenderer(href) {
  document.body.innerHTML = "";
  var style = document.getElementById("style");
  style.setAttribute("href", "withoutAuth.css");
  var authBtn = document.createElement("a");
  authBtn.target = "_blank";
  authBtn.id = "authBtn";
  authBtn.text = "Авторизироваться с Discord";
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var activeTab = tabs[0];
    href += "&url=" + encodeURI(activeTab.url);
    console.log(href);
    authBtn.href = href;
    authBtn.onclick = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var activeTab = tabs[0];
        chrome.tabs.remove(activeTab.id);
      });
    };
    document.body.appendChild(authBtn);
  });
}

function errorRender(err) {
  document.body.innerHTML = "";
  var errordiv = document.createElement("div");
  errordiv.textContent = err;
  document.body.appendChild(errordiv);
}

var rand = function() {
  return Math.random()
    .toString(36)
    .substr(2);
};

function uniqid() {
  return rand() + rand() + rand();
}

var token = uniqid();

chrome.storage.sync.get("token", (res) => {
  if (res.token == undefined) {
    chrome.storage.sync.set({ token: token });
  } else token = res.token;
  axios({
    method: "get",
    url: "http://5.228.43.243:44038/user?token=" + token,
  })
    .then((res) => {
      if (res.data != "Unauthorized") {
        axios({
          method: "get",
          url: "https://discord.com/api/users/@me",
          headers: {
            authorization: res.data,
          },
        }).then((info) => {
          var ava = "https://cdn.discordapp.com/avatars/" + info.data.id + "/" + info.data.avatar;
          if (info.data.avatar[0] + info.data.avatar[1] == "a_") ava += ".gif";
          else ava += ".jpg";
          withAuthRenderer(ava, info.data.username, info.data.discriminator, res.data);
        });
      } else {
        withoutAuthRenderer("http://5.228.43.243:44038/redirect?token=" + token);
      }
    })
    .catch((err) => {
      errorRender(err);
    });
});

document.body.addEventListener("mousemove", (e) => {
  document.body.style.backgroundPosition = String(-e.x * 0.025) + " " + String(-e.y * 0.025);
});
