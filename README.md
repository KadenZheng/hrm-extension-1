# Heart Rate Calculation Chrome Extension

This Chrome extension calculates the heart rate from ECG data provided by a web page. It displays the calculated heart rate on the web page.

## Installation

1. Clone the [repository](https://github.com/KadenZheng/hrm-extension-1) to download the source code.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files, by default the folder named `hrm-extension-1`.

## General Usage

1. Navigate to the extension directory ` hrm-extension-1`. Navigate to the `src/server` directory and run python server.py (or `python3` depending on which version you have installed), to start the heart rate calculation Flask server.
2. Ensure that the _EPLab-SignalViewer_ and the proper server + config/generation clients are running. Refer to the startup documentation on Notion for instructions on starting _EPLab-SignalViewer_ and these instances.
3. In Google Chrome, navigate to the URL `localhost`. You should see a screen to proceed to a local instance.
4. If your extension is loaded correctly, it will automatically start listening for ECG data from the web page.
5. When enough data is accumulated (15,000 data points), the extension will send the data to a local Python server for heart rate calculation.
6. The calculated heart rate will be displayed on the top left corner of the web page.

# Extension Components

## Content Script ([src/content.js](file:///Users/laptopcartuser/hrm-extension/src/content.js#1%2C1-1%2C1))

The content script `content.js `listens for messages from the Signal Viewer window and manages the Chrome runtime. It serves as a sudo-controller to handle setting intervals for EKG signal data retrieval, sending the data to `background.js` for processing, and displaying heart rate information on the screen via HTML injection.

### Dependencies

-   The code relies on the Chrome Extensions API (`chrome.runtime`).

### Event Listener for Window Messages

The core functionality of this code is through an event listener that handles incoming messages from the window.

#### Message Types

-   DATA_RESPONSE: Logs the received **raw** data payload. This functionality is currently only `console.log` since we decided to use the filtered data over raw data to calculate the heart rate.
-   **FILTERED_DATA:** Sets an interval to retrieve filtered signal data from `localStorage` and sends it to the Chrome runtime. This Chrome message is listened to by `background.js`, and so it serves as the pseudo-communication channel between the content script and the service worker.
-   **CONFIG_DATA**: Placeholder for handling configuration data.

```javascript
window.addEventListener("message", (event) => {
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
                    if (filteredSignalData) {
                        chrome.runtime.sendMessage({ data: filteredSignalData });
                    }
                }, 1);
            }
            break;
        case "CONFIG_DATA":
            break;
        default:
    }
});
```

### Chrome Runtime Heart Rate Message Listener

The service worker `background.js` transmits the heart rate data back to the content script through another message. This code adds a listener for messages from the Chrome runtime, and if a message contains heart rate data, it displays this data on the screen.

#### Heart Rate Display

-   Creates a `div` element to display the heart rate if it doesn't already exist.
-   Positions the `div` at the top-left corner of the screen.
-   Updates the `div` with the heart rate data from the message.

```javascript
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
            heartRateElement.style.padding = "10px";
            document.body.appendChild(heartRateElement);
        }
        heartRateElement.textContent = `Heart Rate: ${message.heart_rate} BPM`;
    }
});
```

### Edge Cases and Assumptions

-   **Key Assumption: The data is being streamed from the Signal Viewer through _`window.postMessage()`_, as the extension solely listens for messages coming from the browser.**
-   Assumes that the incoming messages are from the same window.
-   Assumes that `localStorage` contains the key "Filtered Signal Data", which is handled in `EPLab-SignalViewer`.
-   Assumes that heart rate data is provided in the `message.heart_rate` field, which is handled in the background script.

## Background Script ([src/background.js](file:///Users/laptopcartuser/hrm-extension/src/background.js#1%2C1-1%2C1))

### Code Overview

The background script or service worker, `background.js` listens for messages containing signal data, processes the data, and sends it to a local Python server for heart rate calculation. The results are then sent back to the active tab in the Chrome browser.

### Dependencies

-   Chrome Extensions API
-   Fetch API for HTTP requests

### Message Listener

The main functionality is encapsulated in a message listener that processes incoming messages sent from `content.js` and handles the data accordingly. See below.

### Parameters

-   `message`: The message object received from `content.js`.
-   `sender`: The sender of the message (unused)).
-   `sendResponse`: A callback function to send the message containing the heart rate data back to the content script.

### Logic

1. **Data Reception**: The listener waits for messages containing signal data.
    ```javascript
    // This handles the message sending in content.js
    chrome.runtime.sendMessage({ data: filteredSignalData });
    ```
2. **Data Filtering**: It extracts the "DII" signal data from the received message, since that is the signal we use for heart rate calculation.
3. **Data Accumulation**: The script maintains an accumulated dataset, keeping only the most recent 15,000 data points. Once the 15,000 heart rate data points are sent to the server, the script splices the accumulated data to allow for a fresh set of 15,000 data points to be collected.
4. **Data Transmission**: Once enough data is accumulated, it sends the data to the local Python server `server.py ` for heart rate calculation.
5. **Response Handling**: The server's response, including the calculated heart rate, is sent back to the active tab in the Chrome browser.

### Edge Cases and Assumptions

-   Assumes that the incoming message contains a JSON string with a "DII" key.
-   Assumes that the local Python server is running and accessible at `http://localhost:5000/calculate_heart_rate`. See [General Usage]() for server setup instructions.
-   Handles cases where the "DII" signal is not found or the data is not received properly.

## External References

-   [Chrome Extensions API](https://developer.chrome.com/docs/extensions/mv3/messaging/)
-   [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## Heart Rate Calculation Server ([src/server/server.py](file:///Users/laptopcartuser/hrm-extension/src/server/server.py#1%2C1-1%2C1))

This Flask application provides an API to calculate heart rate from a given DII signal. It uses signal processing techniques to filter the signal and detect R-peaks, which are then used to compute the heart rate.

### Dependencies

Use `pip install <dependency_name>` to install each required dependency listed below.

-   Flask
-   NumPy
-   SciPy
-   Logging

#### Function: `bandpass_filter`

Filters the input signal using a band-pass filter. This may be removed if bandpass filtering is done before streaming the filtered data in the Signal Viewer.

#### Parameters

-   `signal` (array-like): The input signal to be filtered.
-   `lowcut` (float): The lower cutoff frequency of the filter.
-   `highcut` (float): The upper cutoff frequency of the filter.
-   `fs` (float): The sampling frequency of the signal.
-   `order` (int, optional): The order of the filter. Default is 1.

#### Returns

-   `y` (array-like): The filtered signal.

### Function: `calculate_heart_rate`

Calculates the heart rate from the input signal.

### Parameters

-   `signal` (array-like): The input DII signal.
-   `fs` (float): The sampling frequency of the signal.

#### Returns

-   `heart_rate` (float): The calculated heart rate in beats per minute (BPM). Returns `NaN` if heart rate cannot be calculated.
-   `peaks` (list): The list of detected R-peak indices.

### Edge Cases and Assumptions

-   Assumes the input signal is a valid DII signal, which is handled by the service worker `background.js`.
-   Returns `NaN` if the signal length is zero or if no peaks are found.

### API Endpoint: `/calculate_heart_rate`

Calculates the heart rate from the provided DII signal. The background script sends the DII data to this endpoint for processing, and handles the response data (of which the `"heart_rate"` field is )

#### Method

-   `POST`

#### Request Body

-   `dii_signal` (list): The DII signal data.
-   `fs` (int, optional): The sampling frequency. Default is 1000 Hz.

#### Response

-   `200 OK`: Returns the calculated heart rate and detected R-peaks.
    ```json
    {
        "heart_rate": 75.0,
        "r_peaks": [10, 50, 90]
    }
    ```
-   `400 Bad Request`: Returns an error message if the DII signal is not provided or if heart rate cannot be calculated.
    ```json
    {
        "error": "No DII signal data provided"
    }
    ```

### Example Usage

#### Request

```json
{
  "dii_signal": [0.1, 0.2, 0.3, ...],
  "fs": 1000
}
```

### Response

```json
{
    "heart_rate": 75.0,
    "r_peaks": [10, 50, 90]
}
```

## Running the Application

To run the application as explained in the [General Usage]() section, execute the following command:

```bash
python3 server.py
```

The application will be available at `http://0.0.0.0:5000`. However, you need not navigate to the URL as the processing data is all handled programtically by the service worker.

### Logging and Common Errors

Logs are stored in `app.log` with the following format:

```
YYYY-MM-DD HH:MM:SS,sss - LEVEL - MESSAGE
```

The statements to be logged are:

```python
logging.info(f"Length: {len(signal)}")
logging.info(f"PEAKS: {peaks}")
logging.info(f"Filtered Signal: {filtered_signal}")logging.info(f"Detected Peaks: {peaks}")
logging.info(f"Peak Properties: {properties}")
logging.info(f"Peaks: {peaks}")
logging.info("No peaks found")

```

If the heart rate is not displaying, the most common error is that there were not enough peaks detected. For this, you may check the "PEAKS" log to ensure that there were ≥ 2 peaks logged; otherwise the calculation cannot proceed. Thus, you must ensure that your DII signal contains the adequate amount of or is structured properly for peak detection.
