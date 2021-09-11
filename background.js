function injectedFunc(url) {
  var parent = document.getElementsByClassName("top-level-buttons style-scope ytd-menu-renderer")[1];
  var el = document.getElementsByClassName(
    "style-scope ytd-menu-renderer force-icon-button style-default size-default"
  )[2];
  var add = document.createElement("a");
  add.innerHTML = "Ебать";
  add.setAttribute("href", "http://5.228.43.243:44038/play?url=" + url);
  add.setAttribute("target", "_blank");
  parent.insertBefore(add, el);
}

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  chrome.scripting.executeScript({
    target: { tabId: sender.tab.id },
    func: injectedFunc,
    args: [sender.url],
  });
});
