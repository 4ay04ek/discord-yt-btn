function injectedFunc(url) {
  var add = document.createElement("a");
  add.innerHTML = "Ебать";
  add.setAttribute("href", "http://5.228.43.243:44038/play?url=" + url);
  add.setAttribute("target", "_blank");
  var xpath = "//yt-formatted-string[text()='Поделиться']";
  var el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    .parentElement.parentElement;
  console.log(el);
  var r = el.parentElement.insertBefore(add, el);
  console.log(r);
}

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  chrome.scripting.executeScript({
    target: { tabId: sender.tab.id },
    func: injectedFunc,
    args: [sender.url],
  });
});
