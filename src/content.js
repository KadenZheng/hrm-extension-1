// content.js
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data.type) {
    return;
  }

  switch (event.data.type) {
    case "DATA_RESPONSE":
      handleDataResponse(event.data.payload);
      break;
    case "NEW_DATA":
      handleNewData(event.data.payload);
      break;
    case "NEW_SIGNAL_DATA":
      handleNewSignalData(event.data.payload);
      break;
    // Add more cases as needed
  }
});

function handleDataResponse(data) {
  console.log("Data response received:", data);
}

function handleNewData(data) {
  console.log("New data received:", data);
}

function handleNewSignalData(data) {
  console.log("New signal data received:", data);
}
