chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.data) {
    let filteredSignalData = JSON.parse(message.data);

    // Filter the data for the DII signal
    let diiSignalData = filteredSignalData["DII"];
    // console.log(diiSignalData);

    if (diiSignalData) {
      console.log("sending data");
      // Send the DII signal data to the Python server
      fetch("http://localhost:5000/calculate_heart_rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dii_signal: diiSignalData,
          fs: 1000, // Sampling frequency
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
        });
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
