var url;

async function withAuthRenderer(avatar, username, discriminator, token) {
  document.body.innerHTML = "";
  var parser = new DOMParser();
  var r = await fetch("/withAuth.html");
  var doc = parser.parseFromString(await r.text(), "text/html");
  doc.getElementById("avatar").src = avatar;
  doc.getElementById("name").textContent = username;
  doc.getElementById("dis").textContent = "#" + discriminator;
  document.body.appendChild(doc.getElementById("maindiv"));
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];
    if (activeTab.url.includes("youtube.com/watch")) {
      document.getElementById("controls").removeAttribute("hidden");
      document.getElementById("play").onclick = async () => {
        axios.post("http://localhost:44038/play", { url: activeTab.url, token: token });
      };
      document.getElementById("skip").onclick = () => {
        axios.post("http://localhost:44038/skip");
      };
    }
  });
  var playUrl;
  var getUrl = setInterval(async () => {
    playUrl = (await axios.get("http://localhost:44038/getPlay")).data.url;
  }, 1000);
  console.log(playUrl);
  if (playUrl) {
    var progress = document.getElementById("progress");
    setInterval(async () => {
      var time = 0;
      time = (await axios.get("http://localhost:44038/time")).data.time;
    }, 1000);
    var r = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?id=${playUrl.substring(
        32,
        43
      )}&part=contentDetails&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
    );
    var duration = r.data.items[0].contentDetails.duration;
    var minutes = duration.substring(duration.indexOf("PT") + 2, duration.indexOf("M"));
    var seconds = duration.substring(duration.indexOf("M") + 1, duration.indexOf("S"));
    var r = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?id=${playUrl.substring(
        32,
        43
      )}&part=snippets&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
    );
    document.getElementById("preview").src = r.data.items[0].snippet.thumbnails.maxres.url;
    document.getElementById("title").text = r.data.items[0].snippet.title;
  }
}

function withoutAuthRenderer(href) {
  document.body.innerHTML = "";
  var style = document.getElementById("style");
  style.setAttribute("href", "withoutAuth.css");
  var authBtn = document.createElement("a");
  authBtn.target = "_blank";
  authBtn.id = "authBtn";
  authBtn.text = "Авторизироваться с Discord";
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];
    href += "&url=" + encodeURI(activeTab.url);
    console.log(href);
    authBtn.href = href;
    authBtn.onclick = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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

var rand = function () {
  return Math.random().toString(36).substr(2);
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
    url: "http://localhost:44038/user?token=" + token,
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
        withoutAuthRenderer("http://localhost:44038/redirect?token=" + token);
      }
    })
    .catch((err) => {
      errorRender(err);
    });
});

document.body.addEventListener("mousemove", (e) => {
  document.body.style.backgroundPosition = String(-e.x * 0.025) + " " + String(-e.y * 0.025);
});
