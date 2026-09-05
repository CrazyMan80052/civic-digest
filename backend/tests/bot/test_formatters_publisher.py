"""
Tests for Social Platform Formatters and Multi-Channel Broadcaster
Validates 280-char ceiling on Twitter threads, Bluesky/Mastodon limits,
and multi-channel dispatch via mock adapters.
"""

import pytest

from bot.formatters import SocialFormatter
from bot.publisher import MockSocialAdapter, MultiChannelPublisher
from bot.schemas import (
    DocketContextThread,
    EnrichedCivicMatter,
    ImpactPriority,
    NewsArticleContext,
)


@pytest.fixture
def sample_context_thread():
    matter = EnrichedCivicMatter(
        ocd_bill_id="ocd-bill/2026-oh-cleveland-ord-882",
        file_number="Ord-882-2026",
        plain_title="Euclid Avenue Commercial Rezoning for Ground-Floor Retail Development",
        the_what="Reclassifies 14 commercial parcels to allow ground-floor active storefronts.",
        the_who="Ward 5 residents and local small business owners.",
        fiscal_impact_amount=250000.0,
        fiscal_impact_type="Capital Improvement Grant",
        impact_priority=ImpactPriority.HIGH,
        affected_wards=["Ward 5", "Ward 7"],
        official_source_url="https://cleveland.legistar.com/LegislationDetail.aspx?ID=882",
        clerk_matter_id="882",
        receipt_snippet="authorized to expend $250,000 from the Capital Improvement Grant Fund",
        receipt_page_number=2,
    )

    article = NewsArticleContext(
        source_name="Signal Cleveland",
        source_domain="signalcleveland.org",
        title="Council Considers Big Rezoning Push for Historic Commercial Corridor",
        url="https://signalcleveland.org/euclid-rezoning",
        summary_snippet="Merchants discuss economic outlook.",
        relevance_score=0.88,
    )

    return DocketContextThread(
        enriched_matter=matter,
        official_docket_url=matter.official_source_url,
        matched_articles=[article],
        has_multi_perspective=True,
    )


def test_format_twitter_thread_char_limits_and_receipt(sample_context_thread):
    tweets = SocialFormatter.format_twitter_thread(sample_context_thread)

    # 3-part thread due to multi-perspective news article
    assert len(tweets) == 3

    for i, tweet in enumerate(tweets, start=1):
        assert len(tweet) <= 280, f"Tweet {i} exceeded 280 chars: {len(tweet)}"

    # Tweet 1 checks
    assert "Council Update" in tweets[0]
    assert "1/3" in tweets[0]

    # Tweet 2 checks (must have receipt URL and file number)
    assert sample_context_thread.enriched_matter.file_number in tweets[1]
    assert "2/3" in tweets[1]
    assert "http" in tweets[1]

    # Tweet 3 checks (media perspective)
    assert "Local Media Perspective" in tweets[2]
    assert "3/3" in tweets[2]


def test_format_twitter_thread_no_news():
    matter = EnrichedCivicMatter(
        ocd_bill_id="ocd-bill/test-routine",
        file_number="Res-101",
        plain_title="Street Tree Canopy Appreciation Week",
        the_what="Designates an appreciation week for city arborists.",
        the_who="Municipal residents.",
        fiscal_impact_amount=0.0,
        fiscal_impact_type="None",
        impact_priority=ImpactPriority.ROUTINE,
        official_source_url="https://clerk.gov/101",
        clerk_matter_id="101",
        receipt_snippet="hereby proclaims Street Tree Canopy Appreciation Week",
    )
    thread = DocketContextThread(
        enriched_matter=matter,
        official_docket_url=matter.official_source_url,
        matched_articles=[],
        has_multi_perspective=False,
    )

    tweets = SocialFormatter.format_twitter_thread(thread)
    assert len(tweets) == 2
    assert "1/2" in tweets[0]
    assert "2/2" in tweets[1]
    for tweet in tweets:
        assert len(tweet) <= 280


def test_format_bluesky_post_limits(sample_context_thread):
    posts = SocialFormatter.format_bluesky_post(sample_context_thread)
    assert len(posts) == 1
    assert len(posts[0]) <= 300
    assert sample_context_thread.enriched_matter.official_source_url[:30] in posts[0]


def test_format_mastodon_post_limits(sample_context_thread):
    posts = SocialFormatter.format_mastodon_post(sample_context_thread)
    assert len(posts) == 1
    assert len(posts[0]) <= 500
    assert "Receipt Citation" in posts[0]
    assert sample_context_thread.enriched_matter.official_source_url in posts[0]


def test_format_webhook_payload(sample_context_thread):
    payload = SocialFormatter.format_webhook_payload(sample_context_thread)
    assert "embeds" in payload
    assert len(payload["embeds"]) == 1

    embed = payload["embeds"][0]
    assert "Euclid Avenue" in embed["title"]
    assert embed["url"] == sample_context_thread.enriched_matter.official_source_url
    assert any(f["name"] == "Verified Source Receipt" for f in embed["fields"])
    assert any(f["name"] == "Local Media Perspective" for f in embed["fields"])


@pytest.mark.asyncio
async def test_multi_channel_publisher_mock_broadcast(sample_context_thread):
    publisher = MultiChannelPublisher()
    mock_twitter = MockSocialAdapter("twitter")
    publisher.register_adapter("twitter", mock_twitter)

    results = await publisher.broadcast_thread(
        sample_context_thread, channels=["twitter", "bluesky", "webhook"]
    )

    assert "twitter" in results
    assert results["twitter"]["status"] == "success"
    assert results["twitter"]["post_count"] == 3
    assert len(mock_twitter.published_history) == 1

    assert "bluesky" in results
    assert results["bluesky"]["status"] == "success"

    assert "webhook" in results
    assert results["webhook"]["status"] == "success"
