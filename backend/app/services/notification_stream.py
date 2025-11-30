import asyncio
from contextlib import suppress

from app.core.redis_client import redis_client
from app.services.websocket_service import connection_manager
from app.utils.logger import app_logger

STREAM_KEY = "notifications:stream"
READ_BLOCK_MS = 5000
BATCH_COUNT = 20


async def notification_stream_worker():
    """
    Pump Redis stream entries into WebSocket connections.
    Runs forever; cancel on shutdown.
    """
    last_id = "0-0"

    while True:
        try:
            await asyncio.sleep(0)  # allow cancellation
            result = await asyncio.to_thread(
                redis_client.client.xread,
                {STREAM_KEY: last_id},
                block=READ_BLOCK_MS,
                count=BATCH_COUNT,
            )

            if not result:
                continue

            for _, messages in result:
                for entry_id, data in messages:
                    last_id = entry_id
                    user_id = data.get("user_id")
                    if not user_id:
                        continue

                    await connection_manager.send_personal_message(
                        {
                            "type": "notification",
                            "notification": {
                                "id": int(data["id"]),
                                "user_id": int(user_id),
                                "type": data.get("type", ""),
                                "message": data.get("message", ""),
                                "link": data.get("link") or None,
                                "created_at": data.get("created_at"),
                            },
                        },
                        int(user_id),
                    )
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            app_logger.error(f"Notification stream worker error: {exc}")
            await asyncio.sleep(2)


async def stop_notification_worker(task: asyncio.Task | None):
    if task:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task