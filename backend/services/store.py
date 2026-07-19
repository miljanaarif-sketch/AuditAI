import json
import os
import uuid

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def _path(name: str) -> str:
    return os.path.join(DATA_DIR, f"{name}.json")


def load(name: str) -> list[dict]:
    path = _path(name)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save(name: str, records: list[dict]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(_path(name), "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, default=str)


def load_obj(name: str) -> dict:
    path = _path(name)
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_obj(name: str, record: dict) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(_path(name), "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2, default=str)


def exists(name: str) -> bool:
    return os.path.exists(_path(name))


def upload_dir(box: str) -> str:
    path = os.path.join(UPLOADS_DIR, box)
    os.makedirs(path, exist_ok=True)
    return path
