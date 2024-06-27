const sYoutube = 'https://www.youtube.com/watch';
const youtube = 'http://www.youtube.com/watch';
let hideState = false;

chrome.commands.onCommand.addListener(command => {
  console.log('command', command);
  if (command === 'hide') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      //only send the message if user in on youtube watch
      if (tabs[0].url.startsWith(sYoutube) || tabs[0].url.startsWith(youtube)) {
        console.log('On yoututbe');

        if (!hideState) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'hide' }, response => {
            console.log('Title modified:', response?.status);
            setBadge('On', 'green');
          });
          hideState = !hideState;
        } else {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'show' }, response => {
            console.log('Title modified:', response?.status);
            setBadge('Off');
          });
          hideState = !hideState;
        }
      }
    });
  }
});

function setBadge(text, color = '#FF8A8A') {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    console.log('On yoututbe');
    chrome.action.setBadgeText({
      text: text,
      tabId: tabs[0].id
    });
    chrome.action.setBadgeBackgroundColor({
      color: color,
      tabId: tabs[0].id
    });
  });
}

//to set hideState from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setHideState') {
    hideState = request.hideState;
  }
  if (request.action === 'setBadge') {
    const text = request.text;
    setBadge(text);
  }
});
