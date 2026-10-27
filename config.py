from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = str(BASE_DIR / "coffee.db")
IMAGE_DIR = BASE_DIR / "static" / "images"
HOST = "127.0.0.1"
PORT = 5003
DEBUG = True
