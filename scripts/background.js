const sYoutube = "https://www.youtube.com/watch";
const youtube = "http://www.youtube.com/watch"

chrome.commands.onCommand.addListener((command) => {
    console.log("command", command);
    if (command === 'hide') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            //only send the message if user in on youtube watch
            if (tabs[0].url.startsWith(sYoutube) || tabs[0].url.startsWith(youtube)) {
                console.log("On yoututbe")
                chrome.tabs.sendMessage(tabs[0].id, { action: "modifyTitle", newTitle: "" }, (response) => {
                    console.log("Title modified:", response?.status);
                });
            }
        });
    }
})