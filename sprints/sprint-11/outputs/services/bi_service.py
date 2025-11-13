#!/usr/bin/env python3
from flask import Flask, jsonify, request, send_file, make_response
from io import StringIO, BytesIO
from datetime import datetime
import csv
import json
import random
import openpyxl
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Mock reports catalog (also provided in SQL migration)
REPORTS = [
    {"id": "r1", "name": "Hospedagem", "description": "Resumo de ocupação e tarifas", "updated_at": "2025-11-12"},
    {"id": "r2", "name": "Receitas vs Energia", "description": "Comparativo de receita com consumo energético", "updated_at": "2025-11-11"},
    {"id": "r3", "name": "Housekeeping SLA", "description": "Indicadores de atendimento Housekeeping", "updated_at": "2025-11-10"}
]

# Simple CORS for localhost origins
@app.after_request
def apply_cors(response):
    origin = request.headers.get('Origin')
    if origin and 'localhost' in origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route('/bi/health', methods=['GET'])
def health():
    app.logger.info('Healthcheck requested')
    return 'OK', 200

@app.route('/bi/kpis', methods=['GET'])
def kpis():
    # Return mocked KPI numbers
    data = {
        "occupancy_pct": round(random.uniform(0.45,0.92), 3),
        "revpar": round(random.uniform(45.0,220.0),2),
        "kwh": random.randint(1200,9800),
        "open_tickets": random.randint(0,25)
    }
    app.logger.info('KPIs requested: %s', data)
    return jsonify(data)

@app.route('/bi/reports', methods=['GET'])
def reports():
    # simple pagination
    try:
        page = int(request.args.get('page', '1'))
        size = int(request.args.get('size', '10'))
    except ValueError:
        page = 1; size = 10
    total = len(REPORTS)
    start = (page-1)*size
    items = REPORTS[start:start+size]
    payload = { 'page': page, 'size': size, 'total': total, 'items': items }
    app.logger.info('Reports requested: page=%s size=%s', page, size)
    return jsonify(payload)

@app.route('/bi/export', methods=['POST'])
def export_report():
    body = request.get_json(force=True) or {}
    report_id = body.get('reportId')
    fmt = (body.get('format') or 'csv').lower()
    params = body.get('params') or {}

    # find report
    report = next((r for r in REPORTS if r['id']==report_id), None)
    if not report:
        return jsonify({ 'error': 'report not found' }), 404

    # build rows (mocked data)
    rows = [ ['date','metric_a','metric_b','value'] ]
    for i in range(7):
        rows.append([ (datetime.utcnow()).strftime('%Y-%m-%d'), 'a'+str(i), 'b'+str(i), str(random.randint(10,500)) ])

    filename = f"report_{report_id}_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}"

    if fmt == 'json':
        bio = BytesIO()
        bio.write(json.dumps({'report': report, 'rows': rows}).encode('utf-8'))
        bio.seek(0)
        resp = make_response(send_file(bio, mimetype='application/json', as_attachment=True, download_name=filename+'.json'))
        app.logger.info('Exported JSON for %s', report_id)
        return resp

    if fmt == 'csv':
        sio = StringIO()
        writer = csv.writer(sio)
        for r in rows: writer.writerow(r)
        bio = BytesIO(sio.getvalue().encode('utf-8'))
        bio.seek(0)
        resp = make_response(send_file(bio, mimetype='text/csv', as_attachment=True, download_name=filename+'.csv'))
        app.logger.info('Exported CSV for %s', report_id)
        return resp

    if fmt == 'xlsx':
        wb = openpyxl.Workbook()
        ws = wb.active
        for r in rows:
            ws.append(r)
        bio = BytesIO()
        wb.save(bio)
        bio.seek(0)
        resp = make_response(send_file(bio, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', as_attachment=True, download_name=filename+'.xlsx'))
        app.logger.info('Exported XLSX for %s', report_id)
        return resp

    return jsonify({ 'error': 'unsupported format' }), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8086)
