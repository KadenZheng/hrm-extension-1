/* global chrome */

let accumulatedData = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.data) {
        let filteredSignalData = JSON.parse(message.data);
        let diiSignalData = filteredSignalData["DII"];
        // console.log("Received data:", diiSignalData);

        if (diiSignalData) {
            accumulatedData = accumulatedData.slice(-15000); // Remove old points
            accumulatedData.push(...diiSignalData);
            // console.log("accumulated data:", accumulatedData.length);

            if (accumulatedData.length >= 15000) {
                console.log("enough data");
                // console.log(accumulatedData);
                // Send the DII signal data to the Python server
                fetch("http://localhost:5000/calculate_heart_rate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        dii_signal: accumulatedData.slice(-15000), // Changed this line
                        fs: 1000,
                    }),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.error) {
                            console.error("Error:", data.error);
                            sendResponse({ error: data.error });
                        } else {
                            console.log(data.heart_rate.toFixed(2));
                            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                if (tabs && tabs.length > 0) {
                                    chrome.tabs.sendMessage(tabs[0].id, { heart_rate: data.heart_rate.toFixed(2) });
                                } else {
                                    console.error("No active tab found in the current window.");
                                }
                            });
                            sendResponse({ heart_rate: data.heart_rate.toFixed(2), r_peaks: data.r_peaks });
                        }
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                        sendResponse({ error: error.message });
                    })
                    .finally(() => {
                        // Ensure the message channel is closed
                        return true;
                    });

                // Remove the sent data from the accumulated data
                accumulatedData = accumulatedData.slice(15000);
                // console.log("Data after slicing:", accumulatedData.length); // Add this line
            } else {
                sendResponse({ message: "Not enough data accumulated yet" });
            }
        } else {
            console.log("DII signal not found in the data");
            sendResponse({ error: "DII signal not found in the data" });
        }
    } else {
        console.log("EXTENSION: Could not receive filteredData");
        sendResponse({ error: "Could not receive filteredData" });
    }

    return true; // Keep the messaging channel open for async response
});
