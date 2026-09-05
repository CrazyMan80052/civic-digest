"""
Tests for Civic Social Media Bot REST API Endpoints & Scheduler Integration
Covers pipeline execution, moderation review workflow (approve/reject/preview),
roll-call vote overrides, and background scheduler dispatch.
"""

import pytest
from fastapi.testclient import TestClient

from bot.routes import bot_queue
from bot.scheduler import CivicBotScheduler
from main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_in_memory_queue():
    """Ensure in-memory queue state is reset before each test."""
    bot_queue._in_memory_posts.clear()
    yield
    bot_queue._in_memory_posts.clear()


def test_trigger_pipeline_run_enqueues_posts():
    payload = {
        "client_name": "cleveland",
        "state_code": "OH",
        "place_name": "Cleveland",
        "top": 2,
        "auto_approve": False,
    }
    response = client.post("/api/bot/pipeline/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["enqueued_count"] == 3  # Twitter, Bluesky, Mastodon
    assert len(data["posts"]) == 3
    for post in data["posts"]:
        assert post["status"] == "PENDING_MODERATION"


def test_list_pending_moderation_flow():
    # Initially empty
    res_empty = client.get("/api/bot/queue/pending")
    assert res_empty.status_code == 200
    assert res_empty.json() == []

    # Enqueue posts via pipeline
    client.post(
        "/api/bot/pipeline/run",
        json={"place_name": "Cleveland", "auto_approve": False},
    )

    res_pending = client.get("/api/bot/queue/pending")
    assert res_pending.status_code == 200
    pending_list = res_pending.json()
    assert len(pending_list) == 3
    assert all(p["status"] == "PENDING_MODERATION" for p in pending_list)


def test_approve_post_success_and_not_found():
    # Enqueue a post first
    client.post("/api/bot/pipeline/run", json={"place_name": "Cleveland"})
    pending = client.get("/api/bot/queue/pending").json()
    target_id = pending[0]["id"]

    # Approve
    approve_res = client.post(
        f"/api/bot/queue/{target_id}/approve",
        json={"moderator_name": "Council Liaison", "notes": "Looks verified"},
    )
    assert approve_res.status_code == 200
    approved_data = approve_res.json()
    assert approved_data["status"] == "approved"
    assert approved_data["post_status"] == "QUEUED"
    assert approved_data["moderated_by"] == "Council Liaison"

    # Non-existent ID -> 404
    bad_res = client.post(
        "/api/bot/queue/00000000-0000-0000-0000-000000000000/approve"
    )
    assert bad_res.status_code == 404


def test_reject_post_success_and_not_found():
    # Enqueue a post first
    client.post("/api/bot/pipeline/run", json={"place_name": "Cleveland"})
    pending = client.get("/api/bot/queue/pending").json()
    target_id = pending[0]["id"]

    # Reject
    reject_res = client.post(
        f"/api/bot/queue/{target_id}/reject",
        json={"reason": "Missing source PDF attachment link", "moderator_name": "Admin"},
    )
    assert reject_res.status_code == 200
    rejected_data = reject_res.json()
    assert rejected_data["status"] == "rejected"
    assert rejected_data["post_status"] == "REJECTED"
    assert "Missing source" in rejected_data["notes"]

    # Non-existent ID -> 404
    bad_res = client.post(
        "/api/bot/queue/00000000-0000-0000-0000-000000000000/reject",
        json={"reason": "Not real"},
    )
    assert bad_res.status_code == 404


def test_preview_post_get_and_post():
    client.post("/api/bot/pipeline/run", json={"place_name": "Cleveland"})
    pending = client.get("/api/bot/queue/pending").json()
    target_id = pending[0]["id"]

    # GET preview
    res_get = client.get(f"/api/bot/queue/{target_id}/preview")
    assert res_get.status_code == 200
    data = res_get.json()
    assert data["post_id"] == target_id
    assert "thread_content" in data
    assert "card_image_url" in data

    # POST preview
    res_post = client.post(f"/api/bot/queue/{target_id}/preview")
    assert res_post.status_code == 200
    assert res_post.json()["post_id"] == target_id

    # Non-existent ID -> 404
    bad_res = client.get("/api/bot/queue/00000000-0000-0000-0000-000000000000/preview")
    assert bad_res.status_code == 404


def test_roll_call_vote_override():
    payload = {
        "bill_id": "ocd-bill/2026-oh-cleveland-ord-101",
        "file_number": "Ord-101-2026",
        "action": "Passed",
        "ayes": ["Councilmember Jones", "Councilmember Smith", "Councilmember Lee"],
        "nays": ["Councilmember Adams"],
        "abstentions": [],
        "notes": "Verified from public hearing livestream timestamp 1:14:22.",
    }
    response = client.post("/api/bot/override/roll-call-vote", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "override_recorded"
    record = data["record"]
    assert record["ayes_count"] == 3
    assert record["nays_count"] == 1
    assert record["total_recorded"] == 4
    assert record["action"] == "Passed"


@pytest.mark.asyncio
async def test_scheduler_dispatch_due_posts_integration():
    # Enqueue with auto-approve so posts land directly in QUEUED status
    client.post(
        "/api/bot/pipeline/run",
        json={"place_name": "Cleveland", "auto_approve": True},
    )

    scheduler = CivicBotScheduler(queue_manager=bot_queue)
    dispatched = await scheduler.dispatch_due_posts()

    assert len(dispatched) == 3
    for d in dispatched:
        assert d["result"]["status"] == "success"
        assert "mock" in d["result"]["post_id"]

    # Due posts should now be empty
    remaining_due = bot_queue.get_due_posts(None)
    assert len(remaining_due) == 0
