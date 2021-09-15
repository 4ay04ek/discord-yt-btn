var url;

function withAuthRenderer(avatar, username, discriminator, token) {
  document.body.innerHTML = "";
  var style = document.getElementById("style");
  style.setAttribute("href", "withAuth.css");
  var maindiv = document.createElement("div");
  maindiv.id = "maindiv";
  document.body.appendChild(maindiv);
  var txt = document.createElement("p");
  txt.textContent = "Вы авторизированы как:";
  txt.id = "txt";
  maindiv.appendChild(txt);
  var user = document.createElement("div");
  user.id = "user";
  maindiv.appendChild(user);
  var ava = document.createElement("img");
  ava.id = "avatar";
  ava.src = avatar;
  user.appendChild(ava);
  var name = document.createElement("p");
  name.id = "name";
  name.textContent = username;
  user.appendChild(name);
  var dis = document.createElement("p");
  dis.id = "dis";
  dis.textContent = "#" + discriminator;
  user.appendChild(dis);
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var activeTab = tabs[0];
    console.log(activeTab.url);
    if (activeTab.url.includes("youtube.com/watch")) {
      var buttons = document.createElement("div");
      buttons.id = "buttons";
      maindiv.appendChild(buttons);
      var play = document.createElement("div");
      play.id = "play";
      play.textContent = "Включить это на боте";
      play.addEventListener("click", () => {
        axios.post("http://5.228.43.243:44038/play", { url: activeTab.url, token: token });
      });
      buttons.appendChild(play);
      var skip = document.createElement("div");
      skip.id = "skip";
      skip.textContent = "Скип";
      skip.addEventListener("click", () => {
        axios.post("http://5.228.43.243:44038/skip");
      });
      buttons.appendChild(skip);
    }
  });
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
