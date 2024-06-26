let ytTitle = '';
console.log("RUNNING!!");

function modifyYouTubeTitle(newTitle = null) {

  const titleElement = document.querySelector("#title h1 yt-formatted-string");
  const tabTitle = document.querySelector("title");

  console.log("FOUND TITLTE:", titleElement.textContent);

  // Check if the title element exists
  if (titleElement) {
    if (newTitle) {
      titleElement.textContent = newTitle;
      tabTitle.textContent = `${newTitle} - Youtube`;
      ytTitle = newTitle;
      chrome.runtime.sendMessage({ action: "setHideState", hideState: false });
    }
    // If no new title is provided, remove the title
    else {
      ytTitle = titleElement.textContent;
      console.log("title:  ", ytTitle);
      titleElement.textContent = "";
      tabTitle.textContent = "Youtube";
    }
  }
}

function visibilityControl(operation) {
  const titleElement = document.querySelector("#title h1 yt-formatted-string");
  if (operation === 'hide') {
    // titleElement.style.display = "none";
    modifyYouTubeTitle()
  }
  else if (operation === 'show') {
    // titleElement.style.display = "block";
    modifyYouTubeTitle(ytTitle);
  }
}

//On startup

// Listen for messages from the popup 
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "modifyTitle") {
    const { newTitle } = request;
    modifyYouTubeTitle(newTitle);
  }
  else if (request.action === 'show') {
    visibilityControl('show');
  }
  else if (request.action === 'hide') {
    visibilityControl('hide');
  }
  sendResponse({ status: "Success" });
});
