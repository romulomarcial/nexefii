from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)
ALERT_LOG_PATH = os.getenv('ALERT_LOG_PATH', '/data/alert_log.json')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/alerts/rules', methods=['POST'])
def add_rule():
    rule = request.json
    # For demo, just append to log
    log_event({'type': 'rule', 'rule': rule})
    return jsonify({'result': 'rule added'}), 201

@app.route('/alerts/evaluate', methods=['POST'])
def evaluate():
    event = request.json
    # For demo, just append to log
    log_event({'type': 'evaluate', 'event': event})
    return jsonify({'result': 'evaluation complete'}), 200

@app.route('/alerts/notify/webhook', methods=['POST'])
def notify_webhook():
    payload = request.json
    log_event({'type': 'notify', 'payload': payload})
    return jsonify({'result': 'webhook notified'}), 200

def log_event(event):
    try:
        if not os.path.exists(os.path.dirname(ALERT_LOG_PATH)):
            os.makedirs(os.path.dirname(ALERT_LOG_PATH))
        with open(ALERT_LOG_PATH, 'a') as f:
            f.write(json.dumps(event) + '\n')
    except Exception as e:
        print('Log error:', e)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8084)
