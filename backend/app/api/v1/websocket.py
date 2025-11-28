from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.websocket_service import connection_manager
from app.core.security import verify_token
from app.repositories.user_repository import UserRepository
from app.utils.logger import app_logger

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time updates.
    
    Usage from frontend:
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/api/v1/ws?token=YOUR_JWT_TOKEN');
    ```
    """
    try:
        # Verify token
        payload = verify_token(token)
        user_id = payload.get("user_id")
        
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        # Verify user exists
        user_repo = UserRepository(db)
        user = user_repo.get_by_id(user_id)
        
        if not user or not user.is_active or user.is_banned:
            await websocket.close(code=1008, reason="User not authorized")
            return
        
        # Connect
        await connection_manager.connect(websocket, user_id)
        
        try:
            # Send welcome message
            await websocket.send_json({
                "type": "connection",
                "message": "Connected to real-time updates",
                "user_id": user_id
            })
            
            # Listen for messages (keep connection alive)
            while True:
                data = await websocket.receive_text()
                
                # Echo back (optional - for testing)
                await websocket.send_json({
                    "type": "echo",
                    "message": data
                })
        
        except WebSocketDisconnect:
            connection_manager.disconnect(websocket, user_id)
            app_logger.info(f"WebSocket disconnected: User {user_id}")
    
    except Exception as e:
        app_logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass