import os
import sqlite3
from flask import Flask, request, jsonify, render_template

app = Flask(__name__, template_folder='templates', static_folder='static')

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'coffee.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            image_url TEXT,
            votes INTEGER DEFAULT 0
        )
    ''')
    
    # Check if we need to seed the data
    count = cursor.execute('SELECT COUNT(*) FROM items').fetchone()[0]
    if count == 0:
        coffees = [
            (
                "Espresso Ristretto",
                "A short, concentrated, bold shot of pure coffee excellence, brewed under high pressure. Intense and full-bodied.",
                "/static/images/espresso.svg"
            ),
            (
                "Classic Cappuccino",
                "A perfect triple balance of rich espresso, velvety steamed milk, and a thick, cloud-like layer of microfoam.",
                "/static/images/cappuccino.svg"
            ),
            (
                "Flat White Velvet",
                "Creamy microfoam poured carefully over a double shot of ristretto espresso, creating a smooth, strong milky cup.",
                "/static/images/flatwhite.svg"
            ),
            (
                "18hr Kyoto Cold Brew",
                "Slow-steeped in cold water for 18 hours, resulting in an incredibly smooth, naturally sweet, and low-acid brew.",
                "/static/images/coldbrew.svg"
            ),
            (
                "Vanilla Latte Macchiato",
                "Elegant layers of dense frothed milk, robust espresso, and delicate foam, infused with Madagascar vanilla.",
                "/static/images/latte.svg"
            ),
            (
                "Irish Cream Coffee",
                "A warming blend of hot filter coffee, aged Irish whiskey, and brown sugar, topped with chilled thick cream.",
                "/static/images/irish.svg"
            )
        ]
        cursor.executemany(
            'INSERT INTO items (name, description, image_url, votes) VALUES (?, ?, ?, 0)',
            coffees
        )
        conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/coffees', methods=['GET'])
def get_coffees():
    try:
        conn = get_db_connection()
        # Fetch coffees ordered by votes DESC, then name ASC
        coffees = conn.execute('SELECT * FROM items ORDER BY votes DESC, name ASC').fetchall()
        conn.close()
        
        coffees_list = []
        for coffee in coffees:
            coffees_list.append({
                'id': coffee['id'],
                'name': coffee['name'],
                'description': coffee['description'],
                'image_url': coffee['image_url'],
                'votes': coffee['votes']
            })
        return jsonify(coffees_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/coffees/<int:coffee_id>/vote', methods=['POST'])
def vote_coffee(coffee_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if coffee exists
        coffee = conn.execute('SELECT * FROM items WHERE id = ?', (coffee_id,)).fetchone()
        if not coffee:
            conn.close()
            return jsonify({'error': 'Coffee item not found'}), 404
            
        cursor.execute('UPDATE items SET votes = votes + 1 WHERE id = ?', (coffee_id,))
        conn.commit()
        
        # Fetch updated coffee item
        updated_coffee = conn.execute('SELECT * FROM items WHERE id = ?', (coffee_id,)).fetchone()
        conn.close()
        
        return jsonify({
            'id': updated_coffee['id'],
            'name': updated_coffee['name'],
            'votes': updated_coffee['votes']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Create static images folder if it doesn't exist
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'images'), exist_ok=True)
    init_db()
    # Run on Port 5003
    app.run(host='127.0.0.1', port=5003, debug=True)
