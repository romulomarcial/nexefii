from flask import Flask, send_file
import os

app = Flask(__name__)

@app.get("/health")
def health():
    return "OK", 200

@app.get("/openapi")
def openapi_index():
    # Serve o YAML gerado no Sprint 8
    path = os.path.join(os.path.dirname(__file__), "openapi.yaml")
    if not os.path.exists(path):
        return "openapi.yaml not found", 404
    return send_file(path, mimetype="application/yaml")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8081"))
    app.run(host="0.0.0.0", port=port)
