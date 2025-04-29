const sYoutube = "https://www.youtube.com/";
const youtube = "http://www.youtube.com/";
let hideState = false;
const badgeColorOn = "green";
const badgeColorOff = "#FF8A8A";

function initialize() {
  initializeKeyboardShortcutEventListner();
  initializeMessageEventListner();
}

function initializeKeyboardShortcutEventListner() {
  chrome.commands.onCommand.addListener((command) => {
    console.log("command", command);
    if (command === "hide") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        //only send the message if user in on youtube watch
        if (
          tabs[0].url.startsWith(sYoutube) ||
          tabs[0].url.startsWith(youtube)
        ) {
          console.log("On yoututbe");

          if (!hideState) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: "hide" },
              (response) => {
                console.log("Title modified:", response?.status);
                setBadge("On", badgeColorOn);
              },
            );
            hideState = !hideState;
          } else {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: "show" },
              (response) => {
                console.log("Title modified:", response?.status);
                setBadge("Off");
              },
            );
            hideState = !hideState;
          }
        }
      });
    }
  });
}

function setBadge(text, color) {
  const badgeColor = color ?? badgeColorOff;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log("On yoututbe");
    chrome.action.setBadgeText({
      text: text,
      tabId: tabs[0].id,
    });
    chrome.action.setBadgeBackgroundColor({
      color: badgeColor,
      tabId: tabs[0].id,
    });
  });
}

function initializeMessageEventListner() {
  //to set hideState from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "setHideState") {
      hideState = request.hideState;
      const badgeText = hideState ? "On" : "Off";
      const badgeColor = badgeText == "On" ? badgeColorOn : badgeColorOff;
      setBadge(badgeText, badgeColor);
    }
    if (request.action === "setBadge") {
      const text = request.text;
      setBadge(text);
    }
  });
}

export { initialize };
