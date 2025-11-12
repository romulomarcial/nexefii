"""
Simple Demo Property Service (Flask) - generates demo tenants and fake data.
Run: python demo-property-service.py
Requires: flask

This is a lightweight service intended for demos and local use only.
"""
from flask import Flask, jsonify, request
from threading import Thread, Event
import time
import uuid
import random

app = Flask(__name__)

# in-memory stores (demo purposes)
TENANTS = {}
FAKE_WORKERS = {}
STOP_EVENT = Event()


@app.route('/demo/tenants', methods=['POST'])
def create_demo_tenant():
    body = request.get_json() or {}
    slug = body.get('slug') or f"demo-{uuid.uuid4().hex[:6]}"
    tenant = {
        'id': str(uuid.uuid4()),
        'slug': slug,
        'name': body.get('name') or f'Demo {slug}',
        'demo': True,
        'created_at': time.time(),
        'kpis': {}
    }
    TENANTS[slug] = tenant
    return jsonify({'success': True, 'tenant': tenant}), 201


@app.route('/demo/tenants', methods=['GET'])
def list_tenants():
    return jsonify(list(TENANTS.values()))


@app.route('/demo/tenants/<slug>/start', methods=['POST'])
def start_demo_worker(slug):
    if slug not in TENANTS:
        return jsonify({'error': 'tenant not found'}), 404
    interval = int((request.get_json() or {}).get('interval', 300))
    if slug in FAKE_WORKERS:
        return jsonify({'message': 'worker already running'})
    stop_flag = Event()

    def worker_loop(stop_event, tenant_slug, interval):
        while not stop_event.is_set():
            # produce synthetic KPIs
            t = TENANTS.get(tenant_slug)
            if not t:
                break
            t['kpis']['active_users'] = random.randint(1, 50)
            t['kpis']['door_unlocks_per_min'] = random.random() * 5
            t['kpis']['last_tick'] = time.time()
            # simulate event logs frequency
            time.sleep(interval)

    th = Thread(target=worker_loop, args=(stop_flag, slug, interval), daemon=True)
    FAKE_WORKERS[slug] = {'thread': th, 'stop': stop_flag}
    th.start()
    return jsonify({'success': True, 'message': 'worker started', 'interval': interval})


@app.route('/demo/tenants/<slug>/stop', methods=['POST'])
def stop_demo_worker(slug):
    w = FAKE_WORKERS.get(slug)
    if not w:
        return jsonify({'message': 'no worker'}), 404
    w['stop'].set()
    FAKE_WORKERS.pop(slug, None)
    return jsonify({'success': True, 'message': 'stopping worker'})


@app.route('/demo/tenants/<slug>/kpis', methods=['GET'])
def tenant_kpis(slug):
    t = TENANTS.get(slug)
    if not t:
        return jsonify({'error': 'tenant not found'}), 404
    return jsonify(t.get('kpis', {}))


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'tenants': len(TENANTS), 'workers': len(FAKE_WORKERS)})


if __name__ == '__main__':
    print('Starting Demo Property Service on http://127.0.0.1:5001')
    app.run(port=5001)
