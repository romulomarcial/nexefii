from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)
HOUSEKEEPING_URL = os.getenv('HOUSEKEEPING_URL', 'http://housekeeping:8083/hk/ingest/dnd')
ALERTS_URL = os.getenv('ALERTS_URL', 'http://alerts:8084/alerts/evaluate')

@app.route('/dnd/event', methods=['POST'])
def dnd_event():
    data = request.json
    # Forward to housekeeping
    hk_resp = requests.post(HOUSEKEEPING_URL, json=data)
    # Trigger alert evaluation
    alert_resp = requests.post(ALERTS_URL, json={'event': 'dnd', 'data': data})
    return jsonify({
        'housekeeping': hk_resp.json() if hk_resp.ok else {'error': 'hk failed'},
        'alerts': alert_resp.json() if alert_resp.ok else {'error': 'alert failed'}
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8085)
