"""
CivicBot Scheduler & Background Dispatcher
Lightweight native asyncio loop for periodic municipal ingestion,
moderation queue draining, and social broadcast dispatch.
"""

import asyncio
import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

try:
    from ..database import SessionLocal
    from .publisher import MultiChannelPublisher
    from .queue import BotQueueManager
except ImportError:
    from bot.publisher import MultiChannelPublisher
    from bot.queue import BotQueueManager
    from database import SessionLocal

logger = logging.getLogger("civicdigest.bot.scheduler")


class CivicBotScheduler:
    """
    Coordinates periodic background routines:
    1. Due post dispatch (runs every 60s).
    2. Routine digest aggregation (runs daily).
    """

    def __init__(
        self,
        queue_manager: BotQueueManager | None = None,
        publisher: MultiChannelPublisher | None = None,
        dispatch_interval_seconds: int = 60,
    ):
        self.queue = queue_manager or BotQueueManager()
        self.publisher = publisher or MultiChannelPublisher()
        self.dispatch_interval = dispatch_interval_seconds
        self._running = False
        self._task: asyncio.Task[Any] | None = None

    async def start(self) -> None:
        """Starts the periodic background dispatcher task."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._dispatch_loop())
        logger.info("CivicBotScheduler started.")

    async def stop(self) -> None:
        """Gracefully halts the background dispatcher."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("CivicBotScheduler stopped.")

    async def _dispatch_loop(self) -> None:
        """Periodically queries due posts and broadcasts to social channels."""
        while self._running:
            try:
                await self.dispatch_due_posts()
            except Exception as e:
                logger.error(f"Error in dispatch loop iteration: {e}", exc_info=True)
            await asyncio.sleep(self.dispatch_interval)

    async def dispatch_due_posts(self, db: Session | None = None) -> list[dict[str, Any]]:
        """
        Drains QUEUED posts from the moderation queue and broadcasts them.
        Safe to invoke directly in unit tests or CLI runs.
        """
        should_close = False
        if db is None:
            try:
                db = SessionLocal()
                should_close = True
            except Exception:
                db = None

        dispatched_results: list[dict[str, Any]] = []
        try:
            due_posts = self.queue.get_due_posts(db, limit=20)
            for post in due_posts:
                thread_posts = post.thread_content if isinstance(post.thread_content, list) else [str(post.thread_content)]
                res = await self.publisher.broadcast_thread(
                    platform_name=post.platform,
                    thread_posts=thread_posts,
                    card_image_url=post.card_image_url,
                )
                if res.get("success"):
                    self.queue.mark_published(db, str(post.id), published_url=res.get("post_url", ""))
                else:
                    self.queue.mark_failed(db, str(post.id), error_message=res.get("error", "Broadcast failed"))
                dispatched_results.append({
                    "post_id": str(post.id),
                    "platform": post.platform,
                    "result": res,
                    "timestamp": datetime.now(UTC).isoformat(),
                })
        finally:
            if should_close and db is not None:
                db.close()

        return dispatched_results
