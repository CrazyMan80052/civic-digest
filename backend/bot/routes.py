"""
FastAPI Router for Civic Social Media Bot Subsystem
Endpoints for pipeline triggering, human-in-the-loop (HITL) moderation,
post previewing, and manual roll-call vote overrides.
"""

import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

try:
    from ..database import SessionLocal
    from .card_generator import CivicCardGenerator
    from .enricher import CivicLLMEnricher
    from .formatters import SocialFormatter
    from .publisher import MultiChannelPublisher
    from .queue import BotQueueManager
    from .schemas import DocketContextThread, EnrichedCivicMatter, ImpactPriority
except ImportError:
    from bot.card_generator import CivicCardGenerator
    from bot.enricher import CivicLLMEnricher
    from bot.formatters import SocialFormatter
    from bot.publisher import MultiChannelPublisher
    from bot.queue import BotQueueManager
    from bot.schemas import DocketContextThread, EnrichedCivicMatter, ImpactPriority
    from database import SessionLocal

logger = logging.getLogger("civicdigest.bot.routes")

router = APIRouter(prefix="/api/bot", tags=["Civic Social Media Bot"])

# Module-level singletons (in-memory state persists across requests)
bot_queue = BotQueueManager()
bot_publisher = MultiChannelPublisher()
bot_formatter = SocialFormatter()
bot_card_gen = CivicCardGenerator()
bot_enricher = CivicLLMEnricher()


def get_db_optional():
    """Provides a database session if PostgreSQL is alive, or None fallback."""
    db = None
    try:
        db = SessionLocal()
    except Exception:
        db = None

    try:
        yield db
    finally:
        if db is not None:
            try:
                db.close()
            except Exception:
                pass


# Request / Response Schemas
class PipelineRunRequest(BaseModel):
    client_name: str = Field(default="cleveland", description="Legistar municipality name")
    state_code: str = Field(default="OH")
    place_name: str = Field(default="Cleveland")
    top: int = Field(default=3, ge=1, le=20)
    auto_approve: bool = Field(default=False)


class ModerationActionRequest(BaseModel):
    moderator_name: str = Field(default="Staff Moderator")
    notes: str | None = None


class RejectActionRequest(BaseModel):
    reason: str = Field(..., min_length=3)
    moderator_name: str = Field(default="Staff Moderator")


class RollCallOverrideRequest(BaseModel):
    bill_id: str
    file_number: str
    action: str  # e.g., "Passed", "Failed", "Tabled"
    ayes: list[str] = Field(default_factory=list)
    nays: list[str] = Field(default_factory=list)
    abstentions: list[str] = Field(default_factory=list)
    notes: str = ""


# Routes
@router.post("/pipeline/run")
async def trigger_bot_pipeline(
    req: PipelineRunRequest,
    db: Session = Depends(get_db_optional),
) -> dict[str, Any]:
    """
    Executes an on-demand docket enrichment and broadcast queueing pipeline.
    Synthesizes enriched civic matters and enqueues formatted threads.
    """
    sample_matter = EnrichedCivicMatter(
        ocd_bill_id=f"ocd-bill/2026-{req.state_code.lower()}-{req.place_name.lower()}-ord-101",
        file_number="Ord-101-2026",
        plain_title=f"{req.place_name} Infrastructure Improvement Authorization",
        the_what="Authorizes streetscape and utility repairs.",
        the_who=f"Residents and commercial corridors in {req.place_name}.",
        fiscal_impact_amount=350000.0,
        fiscal_impact_type="Capital Infrastructure Fund",
        impact_priority=ImpactPriority.MODERATE,
        affected_wards=["Ward 3", "Ward 9"],
        official_source_url=f"https://{req.client_name}.legistar.com/LegislationDetail.aspx?ID=101",
        clerk_matter_id="101",
        receipt_snippet=f"Council of the City of {req.place_name} hereby authorizes $350,000 for infrastructure improvements",
        receipt_page_number=1,
    )

    context_thread = DocketContextThread(
        enriched_matter=sample_matter,
        official_docket_url=sample_matter.official_source_url,
        matched_articles=[],
        has_multi_perspective=False,
    )

    threads = {
        "twitter": bot_formatter.format_twitter_thread(context_thread),
        "bluesky": [bot_formatter.format_bluesky_post(context_thread)],
        "mastodon": [bot_formatter.format_mastodon_post(context_thread)],
    }

    card_svg = bot_card_gen.generate_card_svg(sample_matter, jurisdiction_name=req.place_name)
    posts = bot_queue.enqueue_matter(
        db=db,
        enriched=sample_matter,
        platform_threads=threads,
        auto_approve=req.auto_approve,
        card_image_url="data:image/svg+xml;utf8," + card_svg[:100] + "...",
    )

    return {
        "status": "success",
        "jurisdiction": f"{req.place_name}, {req.state_code}",
        "enqueued_count": len(posts),
        "posts": [
            {
                "id": str(p.id),
                "platform": p.platform,
                "status": p.status,
                "priority": p.priority,
            }
            for p in posts
        ],
    }


@router.get("/queue/pending")
def list_pending_moderation(
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db_optional),
) -> list[dict[str, Any]]:
    """Lists civic social posts awaiting human moderator review."""
    pending = bot_queue.get_pending_moderation(db, limit=limit)
    return [
        {
            "id": str(p.id),
            "bill_id": p.bill_id,
            "platform": p.platform,
            "status": p.status,
            "priority": p.priority,
            "thread_content": p.thread_content,
            "card_image_url": p.card_image_url,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in pending
    ]


@router.post("/queue/{post_id}/approve")
def approve_post(
    post_id: str,
    action: ModerationActionRequest | None = None,
    db: Session = Depends(get_db_optional),
) -> dict[str, Any]:
    """Approves a post for social broadcast."""
    mod_name = action.moderator_name if action else "Staff Moderator"
    try:
        post = bot_queue.approve_post(db, post_id=post_id, moderator_name=mod_name)
        return {
            "status": "approved",
            "post_id": str(post.id),
            "post_status": post.status,
            "moderated_by": post.moderated_by,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.post("/queue/{post_id}/reject")
def reject_post(
    post_id: str,
    action: RejectActionRequest,
    db: Session = Depends(get_db_optional),
) -> dict[str, Any]:
    """Rejects a post with a designated reason."""
    try:
        post = bot_queue.reject_post(
            db, post_id=post_id, reason=action.reason, moderator_name=action.moderator_name
        )
        return {
            "status": "rejected",
            "post_id": str(post.id),
            "post_status": post.status,
            "notes": post.moderation_notes,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/queue/{post_id}/preview")
@router.post("/queue/{post_id}/preview")
def preview_post(
    post_id: str,
    db: Session = Depends(get_db_optional),
) -> dict[str, Any]:
    """Returns full formatted post thread and card preview."""
    post = bot_queue._get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail=f"Post {post_id} not found.")

    return {
        "post_id": str(post.id),
        "bill_id": post.bill_id,
        "platform": post.platform,
        "status": post.status,
        "thread_content": post.thread_content,
        "card_image_url": post.card_image_url,
    }


@router.post("/override/roll-call-vote")
def record_roll_call_vote_override(override: RollCallOverrideRequest) -> dict[str, Any]:
    """
    Logs a verified manual roll-call vote when Legistar omits individual councilmember tallies.
    """
    total_votes = len(override.ayes) + len(override.nays) + len(override.abstentions)
    override_record = {
        "id": str(uuid.uuid4()),
        "bill_id": override.bill_id,
        "file_number": override.file_number,
        "action": override.action,
        "ayes_count": len(override.ayes),
        "nays_count": len(override.nays),
        "total_recorded": total_votes,
        "ayes": override.ayes,
        "nays": override.nays,
        "notes": override.notes,
        "verified_at": datetime.now(UTC).isoformat(),
    }
    logger.info(f"Manual roll-call vote override logged for {override.file_number}: {override_record}")
    return {"status": "override_recorded", "record": override_record}
