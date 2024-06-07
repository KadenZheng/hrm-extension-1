// Add an event listener to handle incoming messages
window.addEventListener("message", (event) => {
  // Ensure the message is from the same window
  if (event.source !== window) return;
  switch (event.data.type) {
    case "DATA_RESPONSE":
      console.log("EXTENSION: DATA_RESPONSE received:", event.data.payload);
      break;
    case "FILTERED_DATA":
      const filteredSignalData = localStorage.getItem("Filtered Signal Data");
      if (filteredSignalData) {
        setInterval(() => {
          chrome.runtime.sendMessage({ data: filteredSignalData });
        }, 10000); // 1000 milliseconds = 1 second
      }
      break;
    case "CONFIG_DATA":
      console.log("EXTENSION: CONFIG_DATA received:", event.data.payload);
      break;
    default:
      console.log("EXTENSION: Unknown message type:", event.data.type);
  }
});

// Request the Config upon loading of the Chrome extension
// !Likely will not be necessary since the LiveService.ts will always send
// window.addEventListener("load", () => {
//   window.postMessage({ type: "REQUEST_CONFIG" }, "*");
// });
