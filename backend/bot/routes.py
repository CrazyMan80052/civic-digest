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
def synthesize_matter_for_municipality(
    client_name: str,
    place_name: str,
    state_code: str,
) -> EnrichedCivicMatter:
    client = client_name.lower().strip()
    place = place_name.strip() or client.title()
    state = state_code.strip().upper() or "US"

    if client == "dublin" or place.lower() == "dublin":
        return EnrichedCivicMatter(
            ocd_bill_id="ocd-bill/2026-oh-dublin-ord-01-26",
            file_number="Ord. 01-26",
            plain_title="Dublin Noise Control & Engine Braking Prohibition",
            the_what="Modernizes vehicle decibel limits, regulates high-output sound equipment, and prohibits compression engine braking.",
            the_who="Dublin residents in residential corridors and motorists along I-270 / SR-161.",
            fiscal_impact_amount=15000.0,
            fiscal_impact_type="Police Operating Fund",
            impact_priority=ImpactPriority.MODERATE,
            affected_wards=["Ward 1", "Ward 2", "Ward 3", "Ward 4"],
            official_source_url="https://dublinohiousa.gov/city-council/legislation-minutes/",
            clerk_matter_id="2601",
            receipt_snippet="An Ordinance amending Chapter 132 (Offenses Against Public Peace) of the Dublin Codified Ordinances to modernize vehicle decibel standards and prohibit compression engine braking",
            receipt_page_number=1,
        )

    if client == "cleveland" or place.lower() == "cleveland":
        return EnrichedCivicMatter(
            ocd_bill_id="ocd-bill/2026-oh-cleveland-ord-101-2026",
            file_number="Ord. 101-2026",
            plain_title="Cleveland Slavic Village Fleet Ave Revitalization",
            the_what="Authorizes $350,000 in matching capital grants for small business facade improvements and pedestrian safety bollards along Fleet Avenue.",
            the_who="Ward 12 residents, merchants, and neighborhood storefront owners.",
            fiscal_impact_amount=350000.0,
            fiscal_impact_type="Capital Infrastructure Fund",
            impact_priority=ImpactPriority.HIGH,
            affected_wards=["Ward 12", "Ward 3"],
            official_source_url="https://cleveland.legistar.com/LegislationDetail.aspx?ID=101",
            clerk_matter_id="101",
            receipt_snippet="Council of the City of Cleveland hereby authorizes $350,000 for Slavic Village Fleet Ave corridor facade modernization and pedestrian improvements",
            receipt_page_number=2,
        )

    if client == "austin" or place.lower() == "austin":
        return EnrichedCivicMatter(
            ocd_bill_id="ocd-bill/2026-tx-austin-res-55",
            file_number="Res. 2026-55",
            plain_title="Austin Urban Heat Island Canopy Protection Standard",
            the_what="Requires 30% minimum preserved canopy coverage on commercial developments exceeding 2 acres.",
            the_who="Austin commercial developers, environmental commissions, and urban transit corridors.",
            fiscal_impact_amount=85000.0,
            fiscal_impact_type="Environmental Protection Fund",
            impact_priority=ImpactPriority.MODERATE,
            affected_wards=["District 3", "District 9"],
            official_source_url="https://austintexas.gov/council",
            clerk_matter_id="55",
            receipt_snippet="Directing the City Manager to adopt standard tree protection requirements of no less than 30% canopy retention for commercial tracts exceeding two acres",
            receipt_page_number=1,
        )

    return EnrichedCivicMatter(
        ocd_bill_id=f"ocd-bill/2026-{state.lower()}-{client}-ord-101",
        file_number="Ord-101-2026",
        plain_title=f"{place} Municipal Infrastructure & Safety Authorization",
        the_what=f"Authorizes streetscape, utility repairs, and pedestrian safety improvements in {place}.",
        the_who=f"Residents, commuters, and commercial corridors in {place}.",
        fiscal_impact_amount=250000.0,
        fiscal_impact_type="Capital Infrastructure Fund",
        impact_priority=ImpactPriority.MODERATE,
        affected_wards=["Ward 1", "Ward 2"],
        official_source_url=f"https://{client}.legistar.com/LegislationDetail.aspx?ID=101",
        clerk_matter_id="101",
        receipt_snippet=f"Council of the City of {place} hereby authorizes capital appropriations for municipal infrastructure and safety improvements",
        receipt_page_number=1,
    )


@router.post("/pipeline/run")
async def trigger_bot_pipeline(
    req: PipelineRunRequest,
    db: Session = Depends(get_db_optional),
) -> dict[str, Any]:
    """
    Executes an on-demand docket enrichment and broadcast queueing pipeline.
    Synthesizes enriched civic matters and enqueues formatted threads.
    """
    sample_matter = synthesize_matter_for_municipality(
        client_name=req.client_name,
        place_name=req.place_name,
        state_code=req.state_code,
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
