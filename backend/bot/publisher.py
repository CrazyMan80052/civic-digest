"""
Multi-Channel Social Broadcaster
Dispatches formatted threads and visual cards across social platforms
(Twitter/X, Bluesky, Mastodon, Webhooks) with mock adapters for local/CI environments.
"""

import logging
from typing import Any, Protocol

from .formatters import SocialFormatter
from .schemas import DocketContextThread

logger = logging.getLogger("civicdigest.bot.publisher")


class SocialChannelAdapter(Protocol):
    async def publish_thread(
        self, posts: list[str], media_bytes: bytes | None = None
    ) -> dict[str, Any]:
        ...


class MockSocialAdapter:
    """
    In-memory mock channel adapter for testing and CI pipelines.
    """

    def __init__(self, platform_name: str):
        self.platform = platform_name
        self.published_history: list[dict[str, Any]] = []

    async def publish_thread(
        self, posts: list[str], media_bytes: bytes | None = None
    ) -> dict[str, Any]:
        entry = {
            "platform": self.platform,
            "posts": posts,
            "media_size": len(media_bytes) if media_bytes else 0,
        }
        self.published_history.append(entry)
        post_id = f"mock-{self.platform}-{len(self.published_history)}"
        return {
            "status": "success",
            "platform": self.platform,
            "post_id": post_id,
            "url": f"https://{self.platform}.example.com/posts/{post_id}",
            "post_count": len(posts),
        }


class WebhookAdapter:
    """
    HTTP POST adapter for generic Discord / Slack / Nextdoor webhooks.
    """

    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    async def publish_thread(
        self, posts: list[str], media_bytes: bytes | None = None
    ) -> dict[str, Any]:
        # For mock/offline, if no live URL, simulate delivery
        if not self.webhook_url or "example.com" in self.webhook_url:
            return {
                "status": "success",
                "platform": "webhook",
                "post_id": "mock-webhook-delivered",
                "url": self.webhook_url,
                "post_count": len(posts),
            }

        import httpx

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(self.webhook_url, json={"content": posts[0]})
            resp.raise_for_status()
            return {
                "status": "success",
                "platform": "webhook",
                "post_id": "webhook-delivered",
                "url": self.webhook_url,
                "post_count": len(posts),
            }


class MultiChannelPublisher:
    """
    Coordinates simultaneous broadcasting across multiple social networks.
    """

    def __init__(self, adapters: dict[str, SocialChannelAdapter] | None = None):
        if adapters is not None:
            self.adapters = adapters
        else:
            # Default to mock adapters for safe development
            self.adapters = {
                "twitter": MockSocialAdapter("twitter"),
                "bluesky": MockSocialAdapter("bluesky"),
                "mastodon": MockSocialAdapter("mastodon"),
                "webhook": MockSocialAdapter("webhook"),
            }
        self.formatter = SocialFormatter()

    def register_adapter(self, platform: str, adapter: SocialChannelAdapter) -> None:
        self.adapters[platform.lower()] = adapter

    async def broadcast_thread(
        self,
        thread: DocketContextThread,
        channels: list[str] | None = None,
        card_bytes: bytes | None = None,
    ) -> dict[str, Any]:
        """
        Formats and broadcasts a docket thread to specified or all registered channels.
        """
        target_channels = [c.lower() for c in channels] if channels else list(self.adapters.keys())
        results: dict[str, Any] = {}

        for ch in target_channels:
            adapter = self.adapters.get(ch)
            if not adapter:
                logger.warning(f"No adapter registered for channel: {ch}")
                results[ch] = {"status": "skipped", "error": f"Unsupported channel {ch}"}
                continue

            # Format posts appropriately per platform
            if ch in ("twitter", "x"):
                posts = self.formatter.format_twitter_thread(thread)
            elif ch == "bluesky":
                posts = self.formatter.format_bluesky_post(thread)
            elif ch == "mastodon":
                posts = self.formatter.format_mastodon_post(thread)
            elif ch == "webhook":
                payload = self.formatter.format_webhook_payload(thread)
                posts = [str(payload)]
            else:
                posts = self.formatter.format_twitter_thread(thread)

            try:
                res = await adapter.publish_thread(posts=posts, media_bytes=card_bytes)
                results[ch] = res
            except Exception as e:
                logger.error(f"Broadcasting error on {ch}: {e}")
                results[ch] = {"status": "failed", "error": str(e)}

        return results
