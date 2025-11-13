import os
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)
HK_URL = os.environ.get("HK_URL", "http://housekeeping:8083")

@app.get("/health")
def health():
    return "OK", 200

# endpoint chamado pelo integrador de fechaduras/PAF/DND
@app.post("/dnd/event")
def dnd_event():
    payload = request.get_json(force=True, silent=True) or {}
    try:
        # encaminha para housekeeping (ingest)
        r = requests.post(f"{HK_URL}/hk/ingest/dnd", json=payload, timeout=5)
        return jsonify({"forwarded_to": f"{HK_URL}/hk/ingest/dnd", "status_code": r.status_code}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 502

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8085)
