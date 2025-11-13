#!/usr/bin/env python3
from flask import Flask, jsonify, request
from datetime import datetime
import logging
import random
import os
import requests

app = Flask(__name__)
logging.basicConfig(level=os.environ.get('AI_LOG_LEVEL','INFO'))

BI_URL = os.environ.get('BI_URL','http://bi:8086')
HOUSEKEEPING_URL = os.environ.get('HOUSEKEEPING_URL','http://housekeeping:8083')
DEMO_PROP_URL = os.environ.get('DEMO_PROP_URL','http://demo-property-service:8082')

@app.route('/ai/health', methods=['GET'])
def health():
    app.logger.info('AI health called')
    return 'OK', 200

@app.route('/ai/insights', methods=['POST'])
def insights():
    req = request.get_json(force=True) or {}
    property_id = req.get('propertyId','demo_001')
    horizon = req.get('horizon','24h')
    metrics = req.get('metrics',['energy','occupancy','alerts'])

    # Fetch KPIs from BI service (best-effort)
    kpis = {}
    try:
        r = requests.get(f"{BI_URL}/bi/kpis", timeout=3)
        if r.ok:
            kpis = r.json()
    except Exception as e:
        app.logger.warning('Failed to fetch BI KPIs: %s', e)

    # Fetch recent reports count
    reports = []
    try:
        r = requests.get(f"{BI_URL}/bi/reports?page=1&size=5", timeout=3)
        if r.ok:
            reports = r.json().get('items', [])
    except Exception as e:
        app.logger.warning('Failed to fetch BI reports: %s', e)

    # Try getting housekeeping summary (best-effort)
    hk_summary = {}
    try:
        r = requests.get(f"{HOUSEKEEPING_URL}/hk/summary", timeout=2)
        if r.ok:
            hk_summary = r.json()
    except Exception:
        # fallback, do not fail
        hk_summary = { 'pending_rooms': random.randint(0,10) }

    # Combine into a mock insight
    summary_text = "Insights for property {}:".format(property_id)
    highlights = []

    # Energy highlight
    if 'kwh' in kpis:
        impact_kwh = int(kpis.get('kwh',0) * 0.05)
        highlights.append({
            'type':'energy',
            'message': f'Reduce setpoint in low-occupancy hours to save energy',
            'impact_kwh': impact_kwh,
            'impact_usd': round(impact_kwh * 0.15,2),
            'priority':'medium'
        })

    # Occupancy highlight
    if 'occupancy_pct' in kpis and kpis.get('occupancy_pct',0) < 0.5:
        highlights.append({
            'type':'occupancy',
            'message':'Low occupancy predicted; consider targeted promotions',
            'impact_kwh': 0,
            'impact_usd': -50,
            'priority':'medium'
        })

    # Housekeeping highlight
    if hk_summary.get('pending_rooms',0) > 5:
        highlights.append({
            'type':'housekeeping',
            'message':'Backlog of rooms >5; prioritize staff or triage tasks',
            'impact_kwh': 0,
            'impact_usd': 0,
            'priority':'high'
        })

    payload = {
        'propertyId': property_id,
        'generatedAt': datetime.utcnow().isoformat()+'Z',
        'summary': 'Automated recommendations based on KPIs and housekeeping status.',
        'highlights': highlights,
        'raw': {
            'kpis': kpis,
            'reportsSample': reports,
            'housekeeping': hk_summary
        }
    }

    # Optionally log to DB or file (disabled in this sprint)
    app.logger.info('Generated insights for %s with %d highlights', property_id, len(highlights))
    return jsonify(payload)

@app.route('/ai/predict', methods=['POST'])
def predict():
    req = request.get_json(force=True) or {}
    metric = req.get('metric','occupancy')
    horizon = req.get('horizon','7d')

    # Fake prediction series
    series = []
    for i in range(7):
        series.append({ 'date': (datetime.utcnow()).strftime('%Y-%m-%d'), 'value': round(random.uniform(0.3,0.9),3) })

    return jsonify({ 'metric': metric, 'horizon': horizon, 'prediction': series })

@app.route('/ai/optimize', methods=['POST'])
def optimize():
    req = request.get_json(force=True) or {}
    objective = req.get('objective','reduce_energy')
    # Provide mock actions
    actions = [
        { 'action':'adjust_setpoint','zone':'floors_3_4','expected_kwh_saving':120,'priority':'high' },
        { 'action':'delay_non_critical_cleaning','expected_kwh_saving':15,'priority':'low' }
    ]
    return jsonify({ 'objective': objective, 'recommendations': actions })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8087)
