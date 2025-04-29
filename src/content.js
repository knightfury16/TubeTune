// local varibles
let ytTitle = "";
let hideState = false; // Track hide state locally
let currentVideoId = "";

function initialize() {
  retryOnStartUp(5, 1000);
  initializeMessageEventListner();
}

function onStartUp() {
  console.log("TubeTune Starting...");
  return new Promise((resolve, reject) => {
    const metadataElement = document.querySelector("ytd-watch-metadata");
    if (metadataElement) {
      currentVideoId = metadataElement.getAttribute("video-id");
      observeVideoIdChanges(metadataElement);
      setGlobalTitle();
      chrome.runtime.sendMessage({ action: "setBadge", text: "Off" });
      resolve(metadataElement);
    } else {
      reject();
    }
  });
}

// Observe changes to the video ID
function observeVideoIdChanges(metadataElement) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === "video-id") {
        console.log("Video ID attribute changed");
        const newVideoId = metadataElement.getAttribute("video-id");
        console.log(
          "New video ID:",
          newVideoId,
          "Current video ID:",
          currentVideoId,
        );
        if (newVideoId !== currentVideoId) {
          currentVideoId = newVideoId;
          setGlobalTitle();
          modifyYouTubeTitle();
          if (hideState) {
            console.log("Hide state is true, hiding title");
            visibilityControl("hide");
          }
        }
      }
    }
  });

  observer.observe(metadataElement, { attributes: true });
  console.log("Started observing video ID changes");
}

function setGlobalTitle(modifiedTitle = null) {
  //getting the title from tab title, element title does not load properly
  const titleElement = document.querySelector("title");
  console.log("Title from title: ", titleElement.innerHTML);
  if (titleElement) {
    if (modifiedTitle) {
      ytTitle = modifiedTitle;
    } else {
      ytTitle = titleElement.textContent;
    }
    console.log("Global title set to: ", ytTitle);
  }
}

function modifyYouTubeTitle(newTitle = null) {
  const titleElement = document.querySelector("#title h1 yt-formatted-string");

  // Check if the title element exists
  if (titleElement) {
    if (newTitle) {
      setGlobalTitle(newTitle);
      titleElement.textContent = ytTitle;
    }
    // If no new title is provided, remove the title
    else {
      // titleElement.textContent = "";
      titleElement.textContent = ytTitle;
    }
  }
}

function visibilityControl(operation) {
  const tabTitle = document.querySelector("title");
  const titleElement = document.querySelector("#title h1 yt-formatted-string");
  const fullScreenElement =
    document.getElementsByClassName("ytp-chrome-top")[0];

  if (operation === "hide") {
    titleElement.style.display = "none";
    fullScreenElement.style.visibility = "hidden";
    tabTitle.textContent = "Youtube";
    hideState = true;
    chrome.runtime.sendMessage({ action: "setHideState", hideState: true });
  } else if (operation === "show") {
    titleElement.style.display = "block";
    fullScreenElement.style.visibility = "visible";
    tabTitle.textContent = `${ytTitle} - Youtube`;
    hideState = false;
    chrome.runtime.sendMessage({ action: "setHideState", hideState: false });
  }
}

//On startup
function retryOnStartUp(retries, interval) {
  return new Promise((resolve, reject) => {
    function attempt(n) {
      onStartUp()
        .then(resolve)
        .catch((error) => {
          if (n === 0) {
            reject(error);
          } else {
            console.log(`Retrying... attempts left: ${n}`);
            setTimeout(() => attempt(n - 1), interval);
          }
        });
    }
    attempt(retries);
  });
}

function initializeMessageEventListner() {
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      if (request.action === "modifyTitle") {
        const { newTitle } = request;
        modifyYouTubeTitle(newTitle);
        visibilityControl("show");
      } else if (request.action === "show") {
        visibilityControl("show");
      } else if (request.action === "hide") {
        visibilityControl("hide");
      }
      sendResponse({ status: "Success" });
    },
  );
}

initialize();
