from config import DB_PATH, IMAGE_DIR
from shared.database import initialize

SCHEMA = """
DROP TABLE IF EXISTS items;
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    category TEXT DEFAULT 'Hot',
    rating_sum INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0
);
"""

COFFEES = [
    (
        "Espresso Ristretto",
        "A short, concentrated, bold shot of pure coffee excellence, brewed under high pressure. Intense and full-bodied.",
        "/static/images/espresso.svg",
        "Hot",
        24,
        5,
    ),
    (
        "Classic Cappuccino",
        "A perfect triple balance of rich espresso, velvety steamed milk, and a thick, cloud-like layer of microfoam.",
        "/static/images/cappuccino.svg",
        "Hot",
        22,
        5,
    ),
    (
        "Flat White Velvet",
        "Creamy microfoam poured carefully over a double shot of ristretto espresso, creating a smooth, strong milky cup.",
        "/static/images/flatwhite.svg",
        "Hot",
        23,
        5,
    ),
    (
        "18hr Kyoto Cold Brew",
        "Slow-steeped in cold water for 18 hours, resulting in an incredibly smooth, naturally sweet, and low-acid brew.",
        "/static/images/coldbrew.svg",
        "Cold",
        24,
        5,
    ),
    (
        "Vanilla Latte Macchiato",
        "Elegant layers of dense frothed milk, robust espresso, and delicate foam, infused with Madagascar vanilla.",
        "/static/images/latte.svg",
        "Hot",
        20,
        5,
    ),
    (
        "Irish Cream Coffee",
        "A warming blend of hot filter coffee, aged Irish whiskey, and brown sugar, topped with chilled thick cream.",
        "/static/images/irish.svg",
        "Special",
        21,
        5,
    ),
]

SEED_SQL = """
INSERT INTO items (name, description, image_url, category, rating_sum, rating_count)
VALUES (?, ?, ?, ?, ?, ?)
"""


def init_db():
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    initialize(DB_PATH, SCHEMA, COFFEES, SEED_SQL)
