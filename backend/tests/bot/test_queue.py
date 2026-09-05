"""
Tests for Bot Queue Manager & Moderation State Machine
Validates queuing defaults, auto-approval for critical matters, HITL state transitions
(PENDING_MODERATION -> QUEUED -> PUBLISHED / REJECTED / FAILED), and retry counting.
"""

import pytest

from bot.queue import BotQueueManager
from bot.schemas import EnrichedCivicMatter, ImpactPriority
from models import PostStatus


@pytest.fixture
def sample_matter():
    return EnrichedCivicMatter(
        ocd_bill_id="ocd-bill/2026-oh-cleveland-ord-882",
        file_number="Ord-882-2026",
        plain_title="Euclid Avenue Rezoning",
        the_what="Reclassifies 14 parcels to Urban Mixed-Use.",
        the_who="Commercial developers and Ward 5 residents.",
        fiscal_impact_amount=250000.0,
        fiscal_impact_type="Capital Improvement",
        impact_priority=ImpactPriority.MODERATE,
        affected_wards=["Ward 5"],
        official_source_url="https://cleveland.legistar.com/LegislationDetail.aspx?ID=882",
        clerk_matter_id="882",
        receipt_snippet="authorized to expend $250,000 from the Capital Improvement Grant Fund",
        receipt_page_number=1,
    )


@pytest.fixture
def critical_matter():
    return EnrichedCivicMatter(
        ocd_bill_id="ocd-bill/2026-oh-cleveland-ord-999",
        file_number="Ord-999-2026",
        plain_title="Emergency Water Main Repair",
        the_what="Declares state of emergency for lead service pipe repairs.",
        the_who="All city residents.",
        fiscal_impact_amount=1500000.0,
        fiscal_impact_type="Emergency Fund",
        impact_priority=ImpactPriority.CRITICAL,
        affected_wards=["All Wards"],
        official_source_url="https://cleveland.legistar.com/LegislationDetail.aspx?ID=999",
        clerk_matter_id="999",
        receipt_snippet="emergency declaration for critical water infrastructure",
        receipt_page_number=1,
    )


def test_enqueue_matter_moderate_defaults_to_pending(sample_matter):
    mgr = BotQueueManager()
    threads = {
        "twitter": ["Tweet 1", "Tweet 2"],
        "mastodon": ["Mastodon Toot 1"],
    }
    posts = mgr.enqueue_matter(None, sample_matter, threads)

    assert len(posts) == 2
    for p in posts:
        assert p.status == PostStatus.PENDING_MODERATION.value
        assert p.bill_id == sample_matter.ocd_bill_id


def test_enqueue_matter_critical_auto_approved(critical_matter):
    mgr = BotQueueManager()
    posts = mgr.enqueue_matter(None, critical_matter, {"twitter": ["Urgent alert"]})

    assert len(posts) == 1
    assert posts[0].status == PostStatus.QUEUED.value
    assert posts[0].priority == ImpactPriority.CRITICAL.value


def test_enqueue_matter_auto_approve_flag(sample_matter):
    mgr = BotQueueManager()
    posts = mgr.enqueue_matter(
        None, sample_matter, {"bluesky": ["Post"]}, auto_approve=True
    )

    assert len(posts) == 1
    assert posts[0].status == PostStatus.QUEUED.value


def test_get_pending_moderation(sample_matter):
    mgr = BotQueueManager()
    mgr.enqueue_matter(None, sample_matter, {"twitter": ["Post 1"]})

    pending = mgr.get_pending_moderation(None)
    assert len(pending) == 1
    assert pending[0].status == PostStatus.PENDING_MODERATION.value


def test_approve_post_transitions_to_queued(sample_matter):
    mgr = BotQueueManager()
    posts = mgr.enqueue_matter(None, sample_matter, {"twitter": ["Post 1"]})
    post_id = str(posts[0].id)

    approved = mgr.approve_post(None, post_id, moderator_name="Elena")
    assert approved.status == PostStatus.QUEUED.value
    assert approved.moderated_by == "Elena"
    assert "Approved" in approved.moderation_notes

    # Verify it now appears in due posts
    due = mgr.get_due_posts(None)
    assert any(str(p.id) == post_id for p in due)


def test_reject_post_transitions_to_rejected(sample_matter):
    mgr = BotQueueManager()
    posts = mgr.enqueue_matter(None, sample_matter, {"twitter": ["Post 1"]})
    post_id = str(posts[0].id)

    rejected = mgr.reject_post(None, post_id, reason="Contains typo in plain_title")
    assert rejected.status == PostStatus.REJECTED.value
    assert "Contains typo" in rejected.moderation_notes

    # Should not appear in due posts
    due = mgr.get_due_posts(None)
    assert not any(str(p.id) == post_id for p in due)


def test_moderation_nonexistent_post_raises(sample_matter):
    mgr = BotQueueManager()
    with pytest.raises(ValueError, match="not found"):
        mgr.approve_post(None, "00000000-0000-0000-0000-000000000000")

    with pytest.raises(ValueError, match="not found"):
        mgr.reject_post(None, "00000000-0000-0000-0000-000000000000", reason="None")


def test_mark_published(sample_matter):
    mgr = BotQueueManager()
    posts = mgr.enqueue_matter(None, sample_matter, {"twitter": ["Post 1"]}, auto_approve=True)
    post_id = str(posts[0].id)

    published = mgr.mark_published(None, post_id, published_url="https://x.com/civic/status/12345")
    assert published.status == PostStatus.PUBLISHED.value
    assert published.published_post_url == "https://x.com/civic/status/12345"
    assert published.published_at is not None


def test_mark_failed_retries_and_terminal_state(sample_matter):
    mgr = BotQueueManager()
    posts = mgr.enqueue_matter(None, sample_matter, {"twitter": ["Post 1"]}, auto_approve=True)
    post_id = str(posts[0].id)

    # Attempt 1
    post = mgr.mark_failed(None, post_id, "HTTP 500 Server Error")
    assert post.retry_count == 1
    assert post.status == PostStatus.QUEUED.value

    # Attempt 2
    post = mgr.mark_failed(None, post_id, "HTTP 502 Bad Gateway")
    assert post.retry_count == 2
    assert post.status == PostStatus.QUEUED.value

    # Attempt 3 -> terminal failure
    post = mgr.mark_failed(None, post_id, "HTTP 401 Unauthorized")
    assert post.retry_count == 3
    assert post.status == PostStatus.FAILED.value
