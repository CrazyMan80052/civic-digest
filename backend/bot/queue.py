"""
Bot Queue Manager & State Machine
Coordinates social post queuing, human-in-the-loop (HITL) moderation approval,
and graceful fallback to in-memory storage when PostgreSQL is offline.
"""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from ..models import PostStatus, SocialPost
from .schemas import EnrichedCivicMatter, ImpactPriority

logger = logging.getLogger("civicdigest.bot.queue")


class BotQueueManager:
    """
    Manages state transitions for social broadcast queue:
    PENDING_MODERATION -> QUEUED -> PUBLISHED / REJECTED / FAILED
    """

    def __init__(self):
        # In-memory dictionary queue fallback when database is disconnected
        self._in_memory_posts: dict[str, SocialPost] = {}

    def enqueue_matter(
        self,
        db: Session | None,
        enriched: EnrichedCivicMatter,
        platform_threads: dict[str, list[str]],
        auto_approve: bool = False,
        card_image_url: str | None = None,
    ) -> list[SocialPost]:
        """
        Creates SocialPost queue records for each target platform.
        CRITICAL priority items or auto_approve=True bypass moderation directly to QUEUED.
        """
        initial_status = (
            PostStatus.QUEUED.value
            if (auto_approve or enriched.impact_priority == ImpactPriority.CRITICAL)
            else PostStatus.PENDING_MODERATION.value
        )

        posts: list[SocialPost] = []
        for platform, content in platform_threads.items():
            post = SocialPost(
                id=uuid.uuid4(),
                bill_id=enriched.ocd_bill_id,
                platform=platform.lower(),
                status=initial_status,
                priority=enriched.impact_priority.value,
                thread_content=content,
                card_image_url=card_image_url,
                created_at=datetime.now(UTC),
            )
            posts.append(post)

        if db is not None:
            try:
                for post in posts:
                    db.add(post)
                db.commit()
                return posts
            except Exception as e:
                db.rollback()
                logger.warning(f"Database commit failed; falling back to in-memory queue: {e}")

        # In-memory fallback
        for post in posts:
            self._in_memory_posts[str(post.id)] = post
        return posts

    def get_pending_moderation(self, db: Session | None, limit: int = 50) -> list[SocialPost]:
        """Returns all posts awaiting human approval."""
        if db is not None:
            try:
                return (
                    db.query(SocialPost)
                    .filter(SocialPost.status == PostStatus.PENDING_MODERATION.value)
                    .order_by(SocialPost.created_at.desc())
                    .limit(limit)
                    .all()
                )
            except Exception as e:
                logger.warning(f"Database query failed, checking in-memory queue: {e}")

        return [
            p for p in self._in_memory_posts.values()
            if p.status == PostStatus.PENDING_MODERATION.value
        ][:limit]

    def approve_post(
        self, db: Session | None, post_id: str, moderator_name: str = "Moderator"
    ) -> SocialPost:
        """Transitions a post from PENDING_MODERATION to QUEUED."""
        post = self._get_post(db, post_id)
        if not post:
            raise ValueError(f"Post {post_id} not found.")

        post.status = PostStatus.QUEUED.value
        post.moderated_by = moderator_name
        post.moderation_notes = "Approved for broadcast."

        self._save_post(db, post)
        return post

    def reject_post(
        self, db: Session | None, post_id: str, reason: str, moderator_name: str = "Moderator"
    ) -> SocialPost:
        """Transitions a post from PENDING_MODERATION to REJECTED."""
        post = self._get_post(db, post_id)
        if not post:
            raise ValueError(f"Post {post_id} not found.")

        post.status = PostStatus.REJECTED.value
        post.moderated_by = moderator_name
        post.moderation_notes = f"Rejected: {reason}"

        self._save_post(db, post)
        return post

    def get_due_posts(self, db: Session | None, limit: int = 20) -> list[SocialPost]:
        """Fetches posts queued and ready for broadcast."""
        if db is not None:
            try:
                return (
                    db.query(SocialPost)
                    .filter(SocialPost.status == PostStatus.QUEUED.value)
                    .order_by(SocialPost.created_at.asc())
                    .limit(limit)
                    .all()
                )
            except Exception as e:
                logger.warning(f"Database query failed, checking in-memory queue: {e}")

        return [
            p for p in self._in_memory_posts.values()
            if p.status == PostStatus.QUEUED.value
        ][:limit]

    def mark_published(self, db: Session | None, post_id: str, published_url: str) -> SocialPost:
        """Marks a post as successfully broadcast."""
        post = self._get_post(db, post_id)
        if not post:
            raise ValueError(f"Post {post_id} not found.")

        post.status = PostStatus.PUBLISHED.value
        post.published_post_url = published_url
        post.published_at = datetime.now(UTC)

        self._save_post(db, post)
        return post

    def mark_failed(self, db: Session | None, post_id: str, error_message: str) -> SocialPost:
        """Records broadcast failure and updates retry count."""
        post = self._get_post(db, post_id)
        if not post:
            raise ValueError(f"Post {post_id} not found.")

        post.retry_count = (post.retry_count or 0) + 1
        post.error_log = error_message
        if post.retry_count >= 3:
            post.status = PostStatus.FAILED.value

        self._save_post(db, post)
        return post

    def _get_post(self, db: Session | None, post_id: str) -> SocialPost | None:
        clean_id = str(post_id)
        if db is not None:
            try:
                # Support querying with string or UUID
                return db.query(SocialPost).filter(
                    (SocialPost.id == clean_id) | (SocialPost.id == uuid.UUID(clean_id))
                ).first()
            except Exception:
                pass
        return self._in_memory_posts.get(clean_id)

    def _save_post(self, db: Session | None, post: SocialPost) -> None:
        if db is not None:
            try:
                db.add(post)
                db.commit()
                return
            except Exception as e:
                db.rollback()
                logger.warning(f"Failed to update post in DB: {e}")
        self._in_memory_posts[str(post.id)] = post
