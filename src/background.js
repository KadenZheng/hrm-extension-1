let accumulatedData = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.data) {
    let filteredSignalData = JSON.parse(message.data);
    let diiSignalData = filteredSignalData["DII"];

    if (diiSignalData) {
      accumulatedData.push(...diiSignalData);

      if (accumulatedData.length >= 2500) {
        // Send the DII signal data to the Python server
        fetch("http://localhost:5000/calculate_heart_rate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dii_signal: accumulatedData.slice(0, 2500),
            fs: 1000,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.error) {
              console.error("Error:", data.error);
              sendResponse({ error: data.error });
            } else {
              console.log(`Heart Rate: ${data.heart_rate.toFixed(2)} BPM`);
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
        accumulatedData = accumulatedData.slice(2500);
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

