from flask import Flask, jsonify, request
import os, time

app = Flask(__name__)

# estado em memória (demo)
PROPERTIES = [
    {"id": "demo-001", "name": "Nexefii Demo Hotel", "rooms": 120, "city": "Miami"},
    {"id": "demo-002", "name": "Nexefii Beach Resort", "rooms": 80, "city": "Fort Lauderdale"}
]

@app.get("/health")
def health():
    return "OK", 200

@app.get("/demo/properties")
def list_properties():
    return jsonify({"properties": PROPERTIES})

@app.post("/demo/seed")
def seed():
    PROPERTIES.clear()
    PROPERTIES.extend([
        {"id": "demo-001", "name": "Nexefii Demo Hotel", "rooms": 120, "city": "Miami"},
        {"id": "demo-002", "name": "Nexefii Beach Resort", "rooms": 80, "city": "Fort Lauderdale"}
    ])
    return jsonify({"status": "seeded", "count": len(PROPERTIES)}), 201

@app.get("/metrics")
def metrics():
    # métrica simples de exemplo
    return "demo_property_up 1\n", 200, {"Content-Type": "text/plain; version=0.0.4"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8082"))
    # Bind 0.0.0.0 é essencial no container!
    app.run(host="0.0.0.0", port=port)
