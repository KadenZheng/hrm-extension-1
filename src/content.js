// content.js

// Listen for messages from the window
window.addEventListener("message", (event) => {
  // Ensure the message is from the same window
  if (event.source !== window) return;

  // Handle different types of messages
  switch (event.data.type) {
    case "DATA_RESPONSE":
      //!
      console.log("DATA_RESPONSE received:", event.data.payload);
      // console.log("NEW_DATA received:", event.data.payload);
      break;
    case "CONFIG_DATA":
      console.log("CONFIG_DATA received:", event.data.payload);
      break;
    default:
      console.log("Unknown message type:", event.data.type);
  }
});
