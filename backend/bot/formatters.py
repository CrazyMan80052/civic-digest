"""
Social Platform Formatters
Formats enriched civic intelligence threads into platform-compliant posts
for Twitter/X (280-char limit), Bluesky (300-char limit), Mastodon (500-char limit),
and Webhooks. Enforces the Receipt Verification Protocol across all platforms.
"""

from typing import Any

from .schemas import DocketContextThread, EnrichedCivicMatter

TWITTER_CHAR_LIMIT = 280
BLUESKY_CHAR_LIMIT = 300
MASTODON_CHAR_LIMIT = 500


def _truncate(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 3].rstrip() + "..."


def format_fiscal_str(matter: EnrichedCivicMatter) -> str:
    if matter.fiscal_impact_amount <= 0.0:
        return "Regulatory / $0 Direct Budget"
    return f"${matter.fiscal_impact_amount:,.2f} ({matter.fiscal_impact_type})"


class SocialFormatter:
    """
    Formats DocketContextThreads for various social broadcasting platforms.
    """

    @staticmethod
    def format_twitter_thread(thread: DocketContextThread) -> list[str]:
        """
        Formats a 2 or 3-tweet thread strictly obeying Twitter's 280-character ceiling.
        Asserts primary source receipt inclusion.
        """
        matter = thread.enriched_matter
        total_tweets = 3 if thread.has_multi_perspective else 2

        # --- Tweet 1: Hook, Plain Title, Policy Impact ---
        title = _truncate(matter.plain_title, 100)
        what = _truncate(matter.the_what, 85)
        who = _truncate(matter.the_who, 55)

        tweet1 = (
            f"🏛️ Council Update: {title}\n\n"
            f"► What: {what}\n"
            f"► Impact: {who}\n\n"
            f"🧵 1/{total_tweets}"
        )
        if len(tweet1) > TWITTER_CHAR_LIMIT:
            # Emergency trim
            tweet1 = _truncate(tweet1, TWITTER_CHAR_LIMIT - 6) + f" 1/{total_tweets}"

        # --- Tweet 2: Budget & Official Receipt Link ---
        fiscal = format_fiscal_str(matter)
        official_link = matter.official_source_url
        if len(official_link) > 80:
            official_link = official_link[:77] + "..."

        snippet_quote = _truncate(matter.receipt_snippet, 70)

        tweet2 = (
            f"💰 Budget: {fiscal}\n\n"
            f"📜 Source Receipt (Matter #{matter.file_number}):\n"
            f'"{snippet_quote}"\n'
            f"🔗 {official_link}\n\n"
            f"#CivicTech 2/{total_tweets}"
        )
        if len(tweet2) > TWITTER_CHAR_LIMIT:
            tweet2 = (
                f"💰 Budget: {fiscal}\n\n"
                f"📜 Source Receipt #{matter.file_number}:\n"
                f"🔗 {official_link}\n\n"
                f"#CivicTech 2/{total_tweets}"
            )

        tweets = [tweet1, tweet2]

        # --- Tweet 3 (Optional): Local News Context ---
        if thread.has_multi_perspective and thread.matched_articles:
            art = thread.matched_articles[0]
            art_title = _truncate(art.title, 90)
            art_link = _truncate(art.url, 75)

            tweet3 = (
                f"📰 Local Media Perspective:\n"
                f"• {art_title} ({art.source_name})\n"
                f"🔗 {art_link}\n\n"
                f"3/{total_tweets}"
            )
            tweets.append(tweet3)

        return tweets

    @staticmethod
    def format_bluesky_post(thread: DocketContextThread) -> list[str]:
        """
        Formats a high-density Bluesky post or 2-part skeet thread (≤300 chars).
        """
        matter = thread.enriched_matter
        fiscal = format_fiscal_str(matter)
        title = _truncate(matter.plain_title, 110)
        link = _truncate(matter.official_source_url, 70)

        post = (
            f"🏛️ {title}\n\n"
            f"► What: {_truncate(matter.the_what, 80)}\n"
            f"► Cost: {fiscal}\n\n"
            f"📜 Official Receipt: {link}\n"
            f"#CivicDigest #{matter.impact_priority.value.lower()}"
        )
        if len(post) > BLUESKY_CHAR_LIMIT:
            post = _truncate(post, BLUESKY_CHAR_LIMIT)
        return [post]

    @staticmethod
    def format_mastodon_post(thread: DocketContextThread) -> list[str]:
        """
        Formats for Mastodon (≤500 chars).
        """
        matter = thread.enriched_matter
        fiscal = format_fiscal_str(matter)
        wards = ", ".join(matter.affected_wards)

        post = (
            f"🏛️ Municipal Council Alert: {matter.plain_title}\n\n"
            f"• Action: {matter.the_what}\n"
            f"• Affected: {matter.the_who} (Wards: {wards})\n"
            f"• Financial Impact: {fiscal}\n\n"
            f'📜 Receipt Citation (#{matter.file_number}): "{_truncate(matter.receipt_snippet, 80)}"\n'
            f"🔗 Primary Source: {matter.official_source_url}\n\n"
            f"#CivicTech #OpenGov #LocalDemocracy"
        )
        if len(post) > MASTODON_CHAR_LIMIT:
            post = _truncate(post, MASTODON_CHAR_LIMIT)
        return [post]

    @staticmethod
    def format_webhook_payload(thread: DocketContextThread) -> dict[str, Any]:
        """
        Formats rich embed JSON for Discord, Slack, or Nextdoor webhooks.
        """
        matter = thread.enriched_matter
        color_map = {
            "CRITICAL": 0xE11D48,  # Rose Red
            "HIGH": 0xF59E0B,      # Amber
            "MODERATE": 0x3B82F6,  # Blue
            "ROUTINE": 0x10B981,   # Emerald
        }

        fields = [
            {"name": "Summary", "value": matter.the_what, "inline": False},
            {"name": "Who It Affects", "value": matter.the_who, "inline": True},
            {"name": "Budget Impact", "value": format_fiscal_str(matter), "inline": True},
            {"name": "Affected Wards", "value": ", ".join(matter.affected_wards), "inline": True},
            {
                "name": "Verified Source Receipt",
                "value": f"[{matter.file_number}]({matter.official_source_url})\n> {matter.receipt_snippet[:150]}",
                "inline": False,
            },
        ]

        if thread.has_multi_perspective and thread.matched_articles:
            news_lines = [
                f"• [{art.title}]({art.url}) — *{art.source_name}*"
                for art in thread.matched_articles[:2]
            ]
            fields.append({
                "name": "Local Media Perspective",
                "value": "\n".join(news_lines),
                "inline": False,
            })

        return {
            "embeds": [
                {
                    "title": f"🏛️ {matter.plain_title}",
                    "description": f"Priority: **{matter.impact_priority.value}**",
                    "url": matter.official_source_url,
                    "color": color_map.get(matter.impact_priority.value, 0x3B82F6),
                    "fields": fields,
                    "footer": {"text": "CivicDigest • Open Civic Data Protocol (OCD-ID)"},
                }
            ]
        }
