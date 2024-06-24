//* pending to automate the modification

// Debounce function to limit how often modifyYouTubeTitle is called
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedModifyYouTubeTitle = debounce(modifyYouTubeTitle, 500);


// Observe DOM changes and call modifyYouTubeTitle when necessary
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' || mutation.type === 'subtree') {
      debouncedModifyYouTubeTitle();
      // modifyYouTubeTitle();
    }
  });
});

// Observe the entire document for changes
observer.observe(document.body, { childList: true, subtree: true });

// Example usage
// modifyYouTubeTitle("New Title");
// modifyYouTubeTitle(); // To remove the title