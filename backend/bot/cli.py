"""
CivicBot Command Line Interface (CLI)
Provides administrative commands for pipeline runs, moderation queue inspection,
and manual social broadcast dispatch.
"""

import argparse
import asyncio
import sys

from sqlalchemy.orm import Session

try:
    from ..database import SessionLocal
    from .routes import bot_queue, trigger_bot_pipeline
    from .scheduler import CivicBotScheduler
    from .schemas import PipelineRunRequest
except ImportError:
    from bot.routes import bot_queue, trigger_bot_pipeline
    from bot.scheduler import CivicBotScheduler
    from bot.schemas import PipelineRunRequest
    from database import SessionLocal


def get_db() -> Session | None:
    try:
        return SessionLocal()
    except Exception:
        return None


async def run_pipeline_cmd(place: str = "Cleveland", state: str = "OH", auto_approve: bool = False) -> None:
    db = get_db()
    req = PipelineRunRequest(
        place_name=place,
        state_code=state,
        auto_approve=auto_approve,
    )
    result = await trigger_bot_pipeline(req, db=db)
    print(f"Pipeline executed successfully: {result['enqueued_count']} posts enqueued.")


def list_pending_cmd() -> None:
    db = get_db()
    pending = bot_queue.get_pending_moderation(db)
    if not pending:
        print("No posts pending moderation.")
        return
    print(f"Found {len(pending)} posts pending moderation:")
    for p in pending:
        print(f"  [{p.id}] Platform: {p.platform} | Bill: {p.bill_id} | Priority: {p.priority}")


def approve_post_cmd(post_id: str, moderator: str = "CLI Admin") -> None:
    db = get_db()
    try:
        post = bot_queue.approve_post(db, post_id=post_id, moderator_name=moderator)
        print(f"Post {post.id} approved successfully (status: {post.status}).")
    except ValueError as e:
        print(f"Error: {e}")


def reject_post_cmd(post_id: str, reason: str, moderator: str = "CLI Admin") -> None:
    db = get_db()
    try:
        post = bot_queue.reject_post(db, post_id=post_id, reason=reason, moderator_name=moderator)
        print(f"Post {post.id} rejected (status: {post.status}). Notes: {post.moderation_notes}")
    except ValueError as e:
        print(f"Error: {e}")


async def dispatch_due_cmd() -> None:
    scheduler = CivicBotScheduler(queue_manager=bot_queue)
    results = await scheduler.dispatch_due_posts()
    print(f"Dispatched {len(results)} due posts.")


def main():
    parser = argparse.ArgumentParser(description="CivicDigest Social Bot Admin CLI")
    parser.add_argument("--run-pipeline", action="store_true", help="Execute docket ingestion and enqueue posts")
    parser.add_argument("--place", type=str, default="Cleveland", help="Municipality name")
    parser.add_argument("--state", type=str, default="OH", help="State abbreviation")
    parser.add_argument("--auto-approve", action="store_true", help="Bypass moderation queue")
    parser.add_argument("--list-pending", action="store_true", help="List all posts awaiting moderation")
    parser.add_argument("--approve", type=str, metavar="POST_ID", help="Approve a post for broadcast")
    parser.add_argument("--reject", type=str, metavar="POST_ID", help="Reject a post")
    parser.add_argument("--reason", type=str, default="Administrative rejection", help="Rejection reason")
    parser.add_argument("--dispatch-due", action="store_true", help="Broadcast all queued due posts")

    args = parser.parse_args()

    if args.run_pipeline:
        asyncio.run(run_pipeline_cmd(place=args.place, state=args.state, auto_approve=args.auto_approve))
    elif args.list_pending:
        list_pending_cmd()
    elif args.approve:
        approve_post_cmd(args.approve)
    elif args.reject:
        reject_post_cmd(args.reject, reason=args.reason)
    elif args.dispatch_due:
        asyncio.run(dispatch_due_cmd())
    else:
        parser.print_help()
        sys.exit(0)


if __name__ == "__main__":
    main()
