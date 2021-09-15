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
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var activeTab = tabs[0];
    if (activeTab.url.includes("youtube.com/watch")) {
      document.getElementById("controls").removeAttribute("hidden");
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
