function withAuthRenderer(avatar, name) {
  document.body.innerHTML = "";
  var style = document.getElementById("style");
  style.setAttribute("href", "withAuth.css");
  var maindiv = document.createElement("div");
  maindiv.id = "maindiv";
  document.body.appendChild(maindiv);
  var ava = document.createElement("img");
  ava.id = "avatar";
  ava.src = avatar;
  maindiv.appendChild(ava);
}

function withoutAuthRenderer(href) {
  document.body.innerHTML = "";
  var style = document.getElementById("style");
  style.setAttribute("href", "withoutAuth.css");
  var authBtn = document.createElement("a");
  authBtn.target = "_blank";
  authBtn.text = "Авторизироваться с Discord";
  authBtn.href = href;
  document.body.appendChild(authBtn);
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
    url: "http://localhost:44038/user?token=" + token,
  }).then((res) => {
    if (res.data != "Unauthorized") {
      axios({
        method: "get",
        url: "https://discord.com/api/users/@me",
        headers: {
          authorization: res.data,
        },
      }).then((res) => {
        withAuthRenderer(
          "https://cdn.discordapp.com/avatars/" + res.data.id + "/" + res.data.avatar + ".gif",
          res.data.username
        );
      });
    } else {
      withoutAuthRenderer("http://localhost:44038/redirect?token=" + token);
    }
  });
});
