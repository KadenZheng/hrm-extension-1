from flask import Flask, request, jsonify
import numpy as np
from scipy.signal import find_peaks, butter, filtfilt
import logging

logging.basicConfig(filename='app.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

def bandpass_filter(signal, lowcut, highcut, fs, order=1):
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    b, a = butter(order, [low, high], btype='band')
    y = filtfilt(b, a, signal)
    return y

def calculate_heart_rate(signal, fs):
    if len(signal) == 0:
        return np.nan, []

    # Band-pass filter
    filtered_signal = bandpass_filter(signal, 0.5, 40, fs)
    
    # Detect R-peaks
    mean_height = np.mean(filtered_signal)
    peaks, properties = find_peaks(filtered_signal, distance=fs/2.5, height=mean_height)
    logging.info(f"PEAKS PEAKS PEAKS: {peaks}")
    
    logging.info(f"Filtered Signal: {filtered_signal}")
    logging.info(f"Detected Peaks: {peaks}")
    logging.info(f"Peak Properties: {properties}")

    logging.info(f"Peaks: {peaks}")
    if len(peaks) < 2:
        logging.info("No peaks found")
        return np.nan, peaks.tolist()

    # Calculate RR intervals
    rr_intervals = np.diff(peaks) / fs

    if len(rr_intervals) == 0:
        return np.nan, peaks.tolist()

    # Calculate heart rate
    heart_rate = 60 / np.mean(rr_intervals)
    
    return heart_rate, peaks.tolist()

@app.route('/calculate_heart_rate', methods=['POST'])
def get_heart_rate():
    data = request.json
    if 'dii_signal' not in data:
        return jsonify({'error': 'No DII signal data provided'}), 400
    
    dii_signal = np.array(data['dii_signal'])
    fs = data.get('fs', 1000)  # Default sampling frequency is 1000 Hz

    heart_rate, peaks = calculate_heart_rate(dii_signal, fs)
    
    if np.isnan(heart_rate):
        return jsonify({'error': 'Could not calculate heart rate', 'r_peaks': peaks}), 400
    
    return jsonify({'heart_rate': heart_rate, 'r_peaks': peaks})

# Just checking if the server actually works
# @app.route('/health', methods=['GET'])
# def health_check():
#     return jsonify({'status': 'ok'})

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    app.run(host='0.0.0.0', port=5000)