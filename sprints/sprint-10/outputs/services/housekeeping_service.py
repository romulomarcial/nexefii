from flask import Flask, request, jsonify
app = Flask(__name__)

@app.get("/health")
def health():
    return "OK", 200

# ingest DND -> atualiza status (mock)
@app.post("/hk/ingest/dnd")
def ingest_dnd():
    payload = request.get_json(force=True, silent=True) or {}
    # Aqui você pode gravar no DB; por ora só ecoamos
    return jsonify({"status":"received","source":"dnd-adapter","payload":payload}), 200

# exemplo de CRUD simples (mock)
HK_ROOMS = [{"room_number":"101","status":"clean"}, {"room_number":"102","status":"dirty"}]

@app.get("/hk/rooms")
def hk_rooms():
    return jsonify(HK_ROOMS), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8083)
