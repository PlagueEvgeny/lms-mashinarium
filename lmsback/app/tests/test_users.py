import json

import pytest

from tests.conftest import get_user_from_database

async def test_create_user(client, get_user_from_database):
    user_data = {
            "last_name": "Иванов",
            "first_name": "Петр",
            "patronymic": "Сергеевич",
            "telegram": "petr_ivanov",
            "email": "petr.ivanov@gmail.com"
    }
    resp = client.post("/user/", data=json.dumps(user_data))
    data_from_resp = resp.json()
    assert resp.status_code == 200
    assert data_from_resp["last_name"] == user_data["last_name"]
    assert data_from_resp["first_name"] == user_data["first_name"]
    assert data_from_resp["patronymic"] == user_data["patronymic"]
    assert data_from_resp["telegram"] == user_data["telegram"]
    assert data_from_resp["email"] == user_data["email"]
    assert data_from_resp["is_active"] is True
    users_from_db = await get_user_from_database(data_from_resp["user_id"])
    assert len(users_from_db) == 1
    user_from_db = dict(users_from_db[0])
    assert user_from_db["last_name"] == user_data["last_name"]
    assert user_from_db["first_name"] == user_data["first_name"]
    assert user_from_db["patronymic"] == user_data["patronymic"]
    assert user_from_db["telegram"] == user_data["telegram"]
    assert user_from_db["email"] == user_data["email"]
    assert user_from_db["is_active"] is True
    assert str(user_from_db["user_id"]) == data_from_resp["user_id"]


