function modifyYouTubeTitle(newTitle = null) {
  const titleElement = document.querySelector("#title h1 yt-formatted-string");
  const tabTitle = document.querySelector("title");

  console.log("FOUND TITLTE:", titleElement.textContent);

  // Check if the title element exists
  if (titleElement) {
    // Rename the tab title to youtube
    if (newTitle) {
      titleElement.textContent = newTitle;
      tabTitle.textContent = `${newTitle}- Youtube`;
    }
    // If no new title is provided, remove the title
    else {
      titleElement.textContent = "";
      tabTitle.textContent = "Youtube";
    }
  }
}


// Listen for messages from the popup 
chrome.runtime.onMessage.addListener( async (request, sender, sendResponse) => {
  console.log("Recieved on background.js", request);
  if (request.action === "modifyTitle") {
    const {newTitle} = request;
    modifyYouTubeTitle(newTitle);
    sendResponse({ status: "Success" });
  }
});
