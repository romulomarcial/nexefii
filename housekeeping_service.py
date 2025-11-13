from flask import Flask, jsonify, request, abort
import psycopg2
import os

app = Flask(__name__)

# Database connection
DB_PARAMS = {
    'dbname': os.getenv('POSTGRES_DB', 'nexefii'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', 'postgres'),
    'host': os.getenv('POSTGRES_HOST', 'postgres'),
    'port': os.getenv('POSTGRES_PORT', 5432)
}

def get_db():
    return psycopg2.connect(**DB_PARAMS)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/hk/rooms', methods=['GET'])
def get_rooms():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT * FROM hk_rooms_status')
        rooms = [dict(zip([desc[0] for desc in cur.description], row)) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify(rooms)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/hk/tasks', methods=['POST'])
def create_task():
    data = request.json
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('INSERT INTO hk_tasks (room_id, task_type, status, assigned_to) VALUES (%s, %s, %s, %s) RETURNING id',
                    (data['room_id'], data['task_type'], data['status'], data.get('assigned_to')))
        task_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'id': task_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/hk/tasks/<int:task_id>', methods=['PATCH'])
def update_task(task_id):
    data = request.json
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('UPDATE hk_tasks SET status=%s WHERE id=%s', (data['status'], task_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'id': task_id, 'status': data['status']}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/hk/ingest/dnd', methods=['POST'])
def ingest_dnd():
    data = request.json
    # Example: update DND status for a room
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('UPDATE hk_rooms_status SET dnd=%s WHERE room_id=%s', (data['dnd'], data['room_id']))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'room_id': data['room_id'], 'dnd': data['dnd']}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8083)
