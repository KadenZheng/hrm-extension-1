/* global chrome */
console.log("Background script starting...");

import "../public/pyodide/pyodide.asm.js";
import { loadPyodide } from "../public/pyodide/pyodide.mjs";
let accumulatedData = [];

let pyodide;

async function main() {
    pyodide = await loadPyodide({
        indexURL: chrome.runtime.getURL("pyodide/"),
    });

    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");

    await micropip.install("numpy");
    await micropip.install("scipy");

    await pyodide.runPythonAsync(`
    import numpy as np
    from scipy import signal

    def bandpass_filter(signal_data, lowcut, highcut, fs, order=1):
        nyquist = 0.5 * fs
        low = lowcut / nyquist
        high = highcut / nyquist
        b, a = signal.butter(order, [low, high], btype='band')
        y = signal.filtfilt(b, a, signal_data)
        return y

    def calculate_heart_rate(signal_data, fs):
        if len(signal_data) == 0:
            return np.nan, []

        # Band-pass filter
        filtered_signal = bandpass_filter(signal_data, 0.5, 40, fs)
        
        # Detect R-peaks
        mean_height = np.mean(filtered_signal)
        peaks, _ = signal.find_peaks(filtered_signal, distance=fs/2.5, height=mean_height)
        
        if len(peaks) < 2:
            return np.nan, peaks.tolist()

        # Calculate RR intervals
        rr_intervals = np.diff(peaks) / fs

        if len(rr_intervals) == 0:
            return np.nan, peaks.tolist()

        # Calculate heart rate
        heart_rate = 60 / np.mean(rr_intervals)
        
        return heart_rate, peaks.tolist()
  `);

    console.log("Pyodide setup complete");
}

main().catch(console.error);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.data) {
        let filteredSignalData = JSON.parse(message.data);
        let diiSignalData = filteredSignalData["DII"];

        if (diiSignalData) {
            accumulatedData = [...accumulatedData.slice(-15000), ...diiSignalData];

            if (accumulatedData.length >= 15000) {
                try {
                    let result = pyodide.runPython(`
            signal = np.array(${JSON.stringify(accumulatedData)})
            heart_rate, peaks = calculate_heart_rate(signal, 1000)
            {"heart_rate": float(heart_rate), "r_peaks": peaks}
          `);

                    let heartRate = result.heart_rate.toFixed(2);

                    // Send heart rate to active tab
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs && tabs.length > 0) {
                            chrome.tabs.sendMessage(tabs[0].id, { heart_rate: heartRate });
                        }
                    });

                    sendResponse({ heart_rate: heartRate, r_peaks: result.r_peaks });
                } catch (error) {
                    sendResponse({ error: error.message });
                }

                accumulatedData = accumulatedData.slice(15000);
            } else {
                sendResponse({ message: "Not enough data accumulated yet" });
            }
        } else {
            sendResponse({ error: "DII signal not found in the data" });
        }
    } else {
        sendResponse({ error: "Could not receive filteredData" });
    }

    return true;
});

console.log("Background script loaded");
