from flask import Blueprint, jsonify, render_template

from config import DB_PATH
from shared.api import json_error, json_payload
from shared.database import execute, fetch_all, fetch_one

bp = Blueprint("coffees", __name__)

COFFEE_COLUMNS = (
    "id",
    "name",
    "description",
    "image_url",
    "category",
    "rating_sum",
    "rating_count",
    "avg_rating",
)

LIST_QUERY = """
SELECT *,
CASE WHEN rating_count = 0 THEN 0.0 ELSE CAST(rating_sum AS REAL) / rating_count END AS avg_rating
FROM items
ORDER BY avg_rating DESC, rating_count DESC
"""

RATED_QUERY = """
SELECT *, CAST(rating_sum AS REAL) / rating_count AS avg_rating
FROM items
WHERE id = ?
"""


def serialize_coffee(row):
    data = dict(row)
    data["avg_rating"] = round(data["avg_rating"], 1)
    return {column: data[column] for column in COFFEE_COLUMNS if column in data}


@bp.route("/")
def index():
    return render_template("index.html")


@bp.route("/api/coffees", methods=["GET"])
def get_coffees():
    try:
        coffees = fetch_all(DB_PATH, LIST_QUERY)
        return jsonify([serialize_coffee(coffee) for coffee in coffees])
    except Exception as exc:
        return json_error(str(exc), 500)


@bp.route("/api/coffees/<int:coffee_id>/rate", methods=["POST"])
def rate_coffee(coffee_id):
    try:
        data = json_payload()
        stars = data.get("stars")

        if not stars or not (1 <= stars <= 5):
            return json_error("Rating must be an integer between 1 and 5")

        coffee = fetch_one(DB_PATH, "SELECT * FROM items WHERE id = ?", (coffee_id,))
        if not coffee:
            return json_error("Coffee item not found", 404)

        execute(
            DB_PATH,
            """
            UPDATE items
            SET rating_sum = rating_sum + ?, rating_count = rating_count + 1
            WHERE id = ?
            """,
            (stars, coffee_id),
        )

        updated = fetch_one(DB_PATH, RATED_QUERY, (coffee_id,))
        return jsonify(
            {
                "id": updated["id"],
                "name": updated["name"],
                "rating_count": updated["rating_count"],
                "avg_rating": round(updated["avg_rating"], 1),
            }
        )
    except Exception as exc:
        return json_error(str(exc), 500)
