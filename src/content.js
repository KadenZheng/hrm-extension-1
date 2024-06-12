/* global chrome */

// Add an event listener to handle incoming messages
window.addEventListener("message", (event) => {
    // Ensure the message is from the same window
    if (event.source !== window) return;
    switch (event.data.type) {
        case "DATA_RESPONSE":
            console.log("EXTENSION: DATA_RESPONSE received:", event.data.payload);
            break;
        case "FILTERED_DATA":
            if (!window.heartRateInterval) {
                console.log("setting interval");
                window.heartRateInterval = setInterval(() => {
                    const filteredSignalData = localStorage.getItem("Filtered Signal Data");
                    // console.log("Retrieved from localStorage:", filteredSignalData);
                    if (filteredSignalData) {
                        // console.log("Sending data:", filteredSignalData);
                        chrome.runtime.sendMessage({ data: filteredSignalData });
                    }
                }, 1);
            }
            break;
        case "CONFIG_DATA":
            // console.log("EXTENSION: CONFIG_DATA received:", event.data.payload);
            break;
        default:
        // console.log("EXTENSION: Unknown message type:", event.data.type);
    }
});

// Request the Config upon loading of the Chrome extension
// !Likely will not be necessary since the LiveService.ts will always send
// window.addEventListener("load", () => {
//   window.postMessage({ type: "REQUEST_CONFIG" }, "*");
// });

chrome.runtime.onMessage.addListener((message) => {
    if (message.heart_rate) {
        console.log(message.heart_rate);
        let heartRateElement = document.getElementById("heart-rate");
        if (!heartRateElement) {
            heartRateElement = document.createElement("div");
            heartRateElement.id = "heart-rate";
            heartRateElement.style.position = "fixed";
            heartRateElement.style.top = "10px";
            heartRateElement.style.left = "10px";
            heartRateElement.style.color = "white";
            // heartRateElement.style.backgroundColor = "white";
            heartRateElement.style.padding = "10px";
            // heartRateElement.style.border = "1px solid black";
            document.body.appendChild(heartRateElement);
        }
        heartRateElement.textContent = `Heart Rate: ${message.heart_rate} BPM`;
    }
});
