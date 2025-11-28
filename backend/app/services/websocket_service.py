from typing import Dict, Set
from fastapi import WebSocket
from app.utils.logger import app_logger
import json


class ConnectionManager:
    """Manage WebSocket connections."""
    
    def __init__(self):
        # Store active connections: {user_id: set of WebSocket connections}
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept WebSocket connection."""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        app_logger.info(f"WebSocket connected: User {user_id}")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove WebSocket connection."""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Remove user entry if no more connections
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        app_logger.info(f"WebSocket disconnected: User {user_id}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to specific user (all their connections)."""
        if user_id in self.active_connections:
            disconnected = set()
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    app_logger.error(f"Failed to send message to user {user_id}: {e}")
                    disconnected.add(connection)
            
            # Clean up disconnected connections
            for connection in disconnected:
                self.active_connections[user_id].discard(connection)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected users."""
        disconnected = []
        
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    app_logger.error(f"Failed to broadcast to user {user_id}: {e}")
                    disconnected.append((user_id, connection))
        
        # Clean up disconnected connections
        for user_id, connection in disconnected:
            self.disconnect(connection, user_id)
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if user is online."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0
    
    def get_online_count(self) -> int:
        """Get total number of online users."""
        return len(self.active_connections)


# Global connection manager instance
connection_manager = ConnectionManager()