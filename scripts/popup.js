// popup.js
const sYoutube = "https://www.youtube.com/watch";
const youtube = "http://www.youtube.com/watch"


document.getElementById("modifyButton").addEventListener("click", async () => {
    event.preventDefault();
    const newTitle = document.getElementById("newTitle").value;
    console.log("TITLE:", newTitle);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log(tabs)
        //only send the message if user in on youtube watch
        if (tabs[0].url.startsWith(sYoutube) || tabs[0].url.startsWith(youtube)) {
            console.log("On yoututbe")
            chrome.tabs.sendMessage(tabs[0].id, { action: "modifyTitle", newTitle: newTitle }, (response) => {
                console.log("Title modified:", response?.status);
                window.close();
            });
        }
        else {
            console.log("not on yoututbe")
            window.close();
        }
    });
});
