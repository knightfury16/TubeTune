const hideState = "hideState";

export function getHideState() {
  chrome.storage.local.get([hideState]).then((result) => {
    const newTit = result.hideState;
    console.log("Getting hide state:::", newTit);
  });
}

// isHidden is a boolean
export function setHideState(isHidden) {
  chrome.storage.local.set({ hideState: isHidden }).then(() => {
    console.log("New Hide State set to,", isHidden);
  });
}
