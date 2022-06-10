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

async function checkURL(url) {
  if (url.includes("youtube.com/playlist")) return true;
  var id = getParameterByName("v", url);
  var r = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=contentDetails&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
  );
  if (r.data.items[0].contentDetails.duration.includes("DT")){
    return false;
  }
  return true;
}

async function addToList(url){
  var item = document.createElement("div");
  item.id = "item";
  var id = getParameterByName("v", url);
  let r = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=snippet&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
  );
  var preview = document.createElement("img");
  preview.id = "m-preview";
  var imgtypes = r.data.items[0].snippet.thumbnails;
  preview.src = imgtypes[Object.keys(imgtypes)[Object.keys(imgtypes).length - 1]].url;
  preview.onclick = () => {
    chrome.tabs.create({ url: url });
  };
  item.appendChild(preview);
  var title = document.createElement("div");
  title.id = "m-title";
  title.textContent = r.data.items[0].snippet.title;
  item.appendChild(title);
  console.log(item);
  document.getElementById("list").appendChild(item);
}


var added = []

async function drawList(){
  var list = (await axios.get("http://5.228.43.243:44038/queue")).data;
  var items = new Map();
  for (let el of list) {
    added.push(el);
    var item = document.createElement("div");
    item.id = "item";
    var id = getParameterByName("v", el);
    let r = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=snippet&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
    );
    var preview = document.createElement("img");
    preview.id = "m-preview";
    var imgtypes = r.data.items[0].snippet.thumbnails;
    preview.src = imgtypes[Object.keys(imgtypes)[Object.keys(imgtypes).length - 1]].url;
    preview.onclick = () => {
      chrome.tabs.create({ url: el });
    };
    item.appendChild(preview);
    var title = document.createElement("div");
    title.id = "m-title";
    title.textContent = r.data.items[0].snippet.title;
    item.appendChild(title);
    items.set(el, item);
  }
  items.forEach(async (v, k) => {
    document.getElementById("list").appendChild(v);
  });
}

var time_len, time, format, it_format;

function parseTime(r_duration) {
  var hours = 0, minutes = 0, seconds = 0;
  if (r_duration.includes("H")) {
    hours = r_duration.substring(r_duration.indexOf("PT") + 2, r_duration.indexOf("H"));
    if (r_duration.includes("M")) {
      minutes = r_duration.substring(r_duration.indexOf("H") + 1, r_duration.indexOf("M"));
      if (r_duration.includes("S")) seconds = r_duration.substring(r_duration.indexOf("M") + 1, r_duration.indexOf("S"));
    }
    else if (r_duration.includes("S")) seconds = r_duration.substring(r_duration.indexOf("H") + 1, r_duration.indexOf("S"));
    format = (hours > 9 ? "hh" : "h") + ":mm:ss";
  } else if (r_duration.includes("M")) {
    minutes = r_duration.substring(r_duration.indexOf("PT") + 2, r_duration.indexOf("M"));
    if (r_duration.includes("S")) seconds = r_duration.substring(r_duration.indexOf("M") + 1, r_duration.indexOf("S"));
    format = (minutes > 9 ? "mm" : "m") + ":ss";
  } else {
    seconds = r_duration.substring(r_duration.indexOf("PT") + 2, r_duration.indexOf("S"));
    format = "m:ss";
  }
  return [hours, minutes, seconds];
}

async function drawInfo(startTime, playUrl) {
  var open = false;
  document.getElementById("queue").onclick = async () => {
    document.getElementById("list").innerHTML = "";
    if (!open) {
      document.getElementById("list").removeAttribute("hidden");
      document.getElementById("info").setAttribute("hidden", true);
    } else {
      document.getElementById("list").setAttribute("hidden", true);
      document.getElementById("info").removeAttribute("hidden");
    }
    open = !open;
    drawList();
  };
  var id = getParameterByName("v", playUrl);
  var r = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=snippet&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
  );
  document.getElementById("info").removeAttribute("hidden");
  document.getElementById("queue").removeAttribute("hidden");
  var imgtypes = r.data.items[0].snippet.thumbnails;
  document.getElementById("preview").src = imgtypes[Object.keys(imgtypes)[Object.keys(imgtypes).length - 1]].url;
  document.getElementById("preview").onclick = () => {
    chrome.tabs.create({ url: playUrl });
  };
  document.getElementById("title").textContent = r.data.items[0].snippet.title;
  var r = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=contentDetails&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
  );
  time = startTime - startTime % 1000;
  var r_duration = r.data.items[0].contentDetails.duration;
  parsedTime = parseTime(r_duration);
  var hours = parsedTime[0], minutes = parsedTime[1], seconds = parsedTime[2];
  time_len = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
  time /= 1000;
  timer = setInterval(() => {
    var it_hours = parseInt(time / 3600), it_minutes = parseInt(time / 60 % 60), it_seconds = parseInt(time % 60);
    if (it_hours) it_format = (it_hours > 9 ? "hh:mm:ss" : "h:mm:ss");
    else it_format = (it_minutes > 9 ? "mm:ss" : "m:ss");
    document.getElementById("time").textContent =
      moment({ h: it_hours, m: it_minutes, s: it_seconds }).format(it_format) + " / " + moment({ h: hours, m: minutes, s: seconds }).format(format);
    document.getElementById("progress").style.width = (time / time_len) * 100 + "%";
    if (time > parseInt(hours * 3600) + parseInt(minutes * 60) + parseInt(seconds)) {
      document.getElementById("info").setAttribute("hidden", true);
      document.getElementById("queue").setAttribute("hidden", true);
      document.getElementById("time").textContent = "0:00 / 0:00";
      document.getElementById("progress").style.width = "0px";
      clearInterval(timer);
      axios.get("http://5.228.43.243:44038/state").then((state) => {
        added.shift();
        if (state.data != "chill") drawInfo(state.data.time, state.data.url);
      });
    }
    time += 1;
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
    if (activeTab.url.includes("youtube.com/watch") || activeTab.url.includes("youtube.com/playlist")) {
      document.getElementById("play").removeAttribute("hidden");
      document.getElementById("play").onclick = async () => {
        var state_inside = await axios.get("http://5.228.43.243:44038/state");
        if (!added.includes(activeTab.url) && (await checkURL(activeTab.url))) {
          var thisTab = activeTab.url;
          if (thisTab.indexOf("watch?v=") == -1 && thisTab.indexOf("list=") != -1) {
            var playlistId = getParameterByName("list", thisTab);
            axios
              .get(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=1000&playlistId=${playlistId}&key=AIzaSyD7cuGUfSYuf2sXA2CjFsYBc5C6O1X5-mU`
              )
              .then((res) => {
                let videos = res.data.items;
                thisTab = "https://www.youtube.com/watch?v=" + videos[0].contentDetails.videoId;
                if (state_inside.data == "chill") drawInfo(0, thisTab);
              });
          } else if (state_inside.data == "chill") drawInfo(0, activeTab.url);
          if (!document.getElementById("queue").hasAttribute("hidden"))
            addToList(activeTab.url);
          added.push(activeTab.url);
          axios.post("http://5.228.43.243:44038/play", { url: activeTab.url, token: token });
        };
      }
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
      added.shift();
      document.getElementById("list").setAttribute("hidden", true);
      document.getElementById("time").textContent = "0:00 / 0:00";
      document.getElementById("progress").style.width = "0px";
      clearInterval(timer);
      if (res.data != "chill") {
        drawInfo(0, res.data.url);
      } else {
        document.getElementById("queue").setAttribute("hidden", true);
        document.getElementById("info").setAttribute("hidden", true);
      }
    });
  };
  if (state.data != "chill"){
    added.push(state.data.url);
    drawInfo(state.data.time + 3000, state.data.url);
  }
  document.getElementById("progress_bar").addEventListener("click", (e) => {
    if (timer != null && it_format != null) {
      if(e.target.id == "progress_bar" || e.target.id == "progress"){
        time = time_len * (e.clientX - 41) / 290;
        var it_hours = parseInt(time / 3600), it_minutes = parseInt(time / 60 % 60), it_seconds = parseInt(time % 60);
        if (it_hours) it_format = (it_hours > 9 ? "hh:mm:ss" : "h:mm:ss");
        else it_format = (it_minutes > 9 ? "mm:ss" : "m:ss");
        document.getElementById("time").textContent = moment({ h: it_hours, m: it_minutes, s: it_seconds }).format(it_format) + " / " + moment({ h: time_len / 3600, m: time_len / 60 % 60, s: time_len % 60}).format(format);
        document.getElementById("progress").style.width = (time / (time_len)) * 100 + "%";
        axios.post("http://5.228.43.243:44038/playtime", {time:  Math.floor(time)});
      }
    }
  })
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
  errordiv.style.color == "white";
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

function loadInfo(data) {
  axios({
    method: "get",
    url: "https://discord.com/api/users/@me",
    headers: {
      authorization: data,
    },
  })
    .then((info) => {
      var ava;
      if(info.data.avatar != null) {
        ava = "https://cdn.discordapp.com/avatars/" + info.data.id + "/" + info.data.avatar;
        if (info.data.avatar[0] + info.data.avatar[1] == "a_") ava += ".gif";
        else ava += ".jpg";
      } else ava = "https://discord.com/assets/c09a43a372ba81e3018c3151d4ed4773.png";
      withAuthRenderer(ava, info.data.username, info.data.discriminator, data);
    })
    .catch((e) => {
      console.log(e);
      if (e.response.status == 401) {
        axios.get("http://5.228.43.243:44038/refresh?token=" + token).then((res) => {
          console.log(res.data);
          loadInfo(res.data);
        });
      }
    });
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
        loadInfo(res.data);
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

