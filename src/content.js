/* global chrome */

console.log("Content script loaded");

window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data.type === "FILTERED_DATA") {
        if (!window.heartRateInterval) {
            console.log("Setting interval for heart rate calculation");
            window.heartRateInterval = setInterval(() => {
                const filteredSignalData = localStorage.getItem("Filtered Signal Data");
                if (filteredSignalData) {
                    console.log("Sending filtered data to background script");
                    chrome.runtime.sendMessage({ data: filteredSignalData });
                }
            }, 1000); // Adjust interval as needed
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in content script:", message);
    if (message.heart_rate) {
        console.log("Heart rate received:", message.heart_rate);
        updateHeartRateDisplay(message.heart_rate);
    }
});

function updateHeartRateDisplay(heartRate) {
    let heartRateElement = document.getElementById("heart-rate");
    if (!heartRateElement) {
        heartRateElement = document.createElement("div");
        heartRateElement.id = "heart-rate";
        heartRateElement.style.position = "fixed";
        heartRateElement.style.top = "10px";
        heartRateElement.style.left = "10px";
        heartRateElement.style.color = "white";
        heartRateElement.style.padding = "10px";
        document.body.appendChild(heartRateElement);
    }
    heartRateElement.textContent = `Heart Rate: ${heartRate} BPM`;
}
