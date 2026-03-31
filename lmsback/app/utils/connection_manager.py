from collections import defaultdict
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, dialog_slug: str, websocket: WebSocket):
        await websocket.accept()
        self._connections[dialog_slug].append(websocket)

    def disconnect(self, dialog_slug: str, websocket: WebSocket):
        self._connections[dialog_slug].remove(websocket)
        if not self._connections[dialog_slug]:
            del self._connections[dialog_slug]

    async def broadcast(self, dialog_slug: str, message: dict):
        for connection in self._connections.get(dialog_slug, []):
            await connection.send_json(message)


manager = ConnectionManager()
