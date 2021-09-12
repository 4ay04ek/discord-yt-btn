var rand = function () {
  return Math.random().toString(36).substr(2); // remove `0.`
};

function token() {
  return rand() + rand() + rand();
}

var token = token();

document.getElementById("auth").setAttribute("href", "http://localhost:44038/redirect?token=" + token);

setInterval(() => {
  axios.get("http://localhost:44038/user?token=" + token).then((res) => {
    document.getElementById("user_info").innerText = res;
  });
}, 1000);
