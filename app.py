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
    cursor.execute('DROP TABLE IF EXISTS items')
    cursor.execute('''
        CREATE TABLE items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            image_url TEXT,
            category TEXT DEFAULT 'Hot',
            rating_sum INTEGER DEFAULT 0,
            rating_count INTEGER DEFAULT 0
        )
    ''')
    
    # Seed coffees with categories and default ratings (30 total initial ratings sum to seed averages)
    coffees = [
        (
            "Espresso Ristretto",
            "A short, concentrated, bold shot of pure coffee excellence, brewed under high pressure. Intense and full-bodied.",
            "/static/images/espresso.svg",
            "Hot", 24, 5  # Avg: 4.8
        ),
        (
            "Classic Cappuccino",
            "A perfect triple balance of rich espresso, velvety steamed milk, and a thick, cloud-like layer of microfoam.",
            "/static/images/cappuccino.svg",
            "Hot", 22, 5  # Avg: 4.4
        ),
        (
            "Flat White Velvet",
            "Creamy microfoam poured carefully over a double shot of ristretto espresso, creating a smooth, strong milky cup.",
            "/static/images/flatwhite.svg",
            "Hot", 23, 5  # Avg: 4.6
        ),
        (
            "18hr Kyoto Cold Brew",
            "Slow-steeped in cold water for 18 hours, resulting in an incredibly smooth, naturally sweet, and low-acid brew.",
            "/static/images/coldbrew.svg",
            "Cold", 24, 5  # Avg: 4.8
        ),
        (
            "Vanilla Latte Macchiato",
            "Elegant layers of dense frothed milk, robust espresso, and delicate foam, infused with Madagascar vanilla.",
            "/static/images/latte.svg",
            "Hot", 20, 5  # Avg: 4.0
        ),
        (
            "Irish Cream Coffee",
            "A warming blend of hot filter coffee, aged Irish whiskey, and brown sugar, topped with chilled thick cream.",
            "/static/images/irish.svg",
            "Special", 21, 5  # Avg: 4.2
        )
    ]
    cursor.executemany(
        'INSERT INTO items (name, description, image_url, category, rating_sum, rating_count) VALUES (?, ?, ?, ?, ?, ?)',
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
        # Sort by average rating (sum/count) descending. Handle divide-by-zero using CASE
        query = '''
            SELECT *, 
            CASE WHEN rating_count = 0 THEN 0.0 ELSE CAST(rating_sum AS REAL)/rating_count END as avg_rating
            FROM items 
            ORDER BY avg_rating DESC, rating_count DESC
        '''
        coffees = conn.execute(query).fetchall()
        conn.close()
        
        coffees_list = []
        for coffee in coffees:
            coffees_list.append({
                'id': coffee['id'],
                'name': coffee['name'],
                'description': coffee['description'],
                'image_url': coffee['image_url'],
                'category': coffee['category'],
                'rating_sum': coffee['rating_sum'],
                'rating_count': coffee['rating_count'],
                'avg_rating': round(coffee['avg_rating'], 1)
            })
        return jsonify(coffees_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/coffees/<int:coffee_id>/rate', methods=['POST'])
def rate_coffee(coffee_id):
    try:
        data = request.get_json() or {}
        stars = data.get('stars')
        
        if not stars or not (1 <= stars <= 5):
            return jsonify({'error': 'Rating must be an integer between 1 and 5'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        coffee = conn.execute('SELECT * FROM items WHERE id = ?', (coffee_id,)).fetchone()
        if not coffee:
            conn.close()
            return jsonify({'error': 'Coffee item not found'}), 404
            
        cursor.execute('''
            UPDATE items 
            SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 
            WHERE id = ?
        ''', (stars, coffee_id))
        conn.commit()
        
        updated = conn.execute('''
            SELECT *, CAST(rating_sum AS REAL)/rating_count as avg_rating 
            FROM items WHERE id = ?
        ''', (coffee_id,)).fetchone()
        conn.close()
        
        return jsonify({
            'id': updated['id'],
            'name': updated['name'],
            'rating_count': updated['rating_count'],
            'avg_rating': round(updated['avg_rating'], 1)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Ensure images folder exists
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'images'), exist_ok=True)
    init_db()
    app.run(host='127.0.0.1', port=5003, debug=True)
