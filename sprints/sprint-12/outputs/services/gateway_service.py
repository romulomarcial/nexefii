#!/usr/bin/env python3
from flask import Flask, jsonify, request, Response
import os
import logging
import requests

app = Flask(__name__)
logging.basicConfig(level=os.environ.get('GATEWAY_LOG_LEVEL','INFO'))
API_KEY = os.environ.get('GATEWAY_API_KEY','devkey')

# Expected API key (dev default)
EXPECTED_API_KEY = os.getenv("NEXEFII_API_KEY", "nexefii-dev-key")

# Simple API key check
def require_api_key():
    # backward-compatible boolean check
    key = request.headers.get('X-Api-Key') or request.args.get('api_key')
    if not key or key != API_KEY:
        return False
    return True


def _check_api_key():
    # New standardized check: accept X-Api-Key or X-API-Key headers.
    key = request.headers.get('X-Api-Key') or request.headers.get('X-API-Key') or request.args.get('api_key')
    if key != EXPECTED_API_KEY:
        return jsonify({"error": "invalid api key"}), 401
    return None

@app.after_request
def add_cors(resp):
    # Development: allow all origins for convenience
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Api-Key'
    resp.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return resp

@app.route('/health', methods=['GET'])
def health():
    return 'OK', 200

# Proxy to BI
@app.route('/api/bi/kpis', methods=['GET'])
def proxy_bi_kpis():
    err = _check_api_key()
    if err is not None:
        return err
    try:
        r = requests.get('http://bi:8086/bi/kpis', timeout=3)
        return Response(r.content, status=r.status_code, content_type=r.headers.get('Content-Type'))
    except Exception as e:
        app.logger.warning('proxy_bi_kpis failed: %s', e)
        return jsonify({'error':'bi unavailable'}), 503

@app.route('/api/bi/reports', methods=['GET'])
def proxy_bi_reports():
    err = _check_api_key()
    if err is not None:
        return err
    try:
        r = requests.get('http://bi:8086/bi/reports', params=request.args, timeout=3)
        return Response(r.content, status=r.status_code, content_type=r.headers.get('Content-Type'))
    except Exception as e:
        app.logger.warning('proxy_bi_reports failed: %s', e)
        return jsonify({'error':'bi unavailable'}), 503

# Proxy to AI
@app.route('/api/ai/<path:subpath>', methods=['GET','POST'])
def proxy_ai(subpath):
    err = _check_api_key()
    if err is not None:
        return err
    url = f'http://ai:8087/ai/{subpath}'
    try:
        if request.method == 'GET':
            r = requests.get(url, params=request.args, timeout=5)
        else:
            r = requests.post(url, json=request.get_json(silent=True), timeout=10)
        return Response(r.content, status=r.status_code, content_type=r.headers.get('Content-Type'))
    except Exception as e:
        app.logger.warning('proxy_ai failed: %s', e)
        return jsonify({'error':'ai unavailable'}), 503

# Simple proxies for PMS and EMS (demo only)
@app.route('/api/pms/<path:subpath>', methods=['GET','POST'])
def proxy_pms(subpath):
    err = _check_api_key()
    if err is not None:
        return err
    target = f'http://demo-property-service:8082/{subpath}'
    try:
        if request.method == 'GET':
            r = requests.get(target, params=request.args, timeout=5)
        else:
            r = requests.post(target, json=request.get_json(silent=True), timeout=5)
        return Response(r.content, status=r.status_code, content_type=r.headers.get('Content-Type'))
    except Exception as e:
        app.logger.warning('proxy_pms failed: %s', e)
        return jsonify({'error':'pms unavailable'}), 503

@app.route('/api/ems/<path:subpath>', methods=['GET','POST'])
def proxy_ems(subpath):
    err = _check_api_key()
    if err is not None:
        return err
    # Try housekeeping first then alerts as fallback
    target1 = f'http://housekeeping:8083/{subpath}'
    try:
        if request.method == 'GET':
            r = requests.get(target1, params=request.args, timeout=5)
        else:
            r = requests.post(target1, json=request.get_json(silent=True), timeout=5)
        return Response(r.content, status=r.status_code, content_type=r.headers.get('Content-Type'))
    except Exception:
        target2 = f'http://alerts:8084/{subpath}'
        try:
            if request.method == 'GET':
                r = requests.get(target2, params=request.args, timeout=5)
            else:
                r = requests.post(target2, json=request.get_json(silent=True), timeout=5)
            return Response(r.content, status=r.status_code, content_type=r.headers.get('Content-Type'))
        except Exception as e:
            app.logger.warning('proxy_ems failed: %s', e)
            return jsonify({'error':'ems unavailable'}), 503

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8088)
