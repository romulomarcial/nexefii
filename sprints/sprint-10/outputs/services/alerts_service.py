from flask import Flask, request, jsonify
app = Flask(__name__)

@app.get("/health")
def health():
    return "OK", 200

ALERT_RULES = [{"id":1,"name":"DND>2h","enabled":True}]
ALERT_EVENTS = []

@app.get("/alerts/rules")
def rules():
    return jsonify(ALERT_RULES), 200

@app.post("/alerts/event")
def event():
    payload = request.get_json(force=True, silent=True) or {}
    ALERT_EVENTS.append(payload)
    return jsonify({"stored": True, "count": len(ALERT_EVENTS)}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8084)
