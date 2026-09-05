"""
Tests for Local News Aggregator and Policy Context Matcher
Validates RSS 2.0 and Atom XML parsing, lexical keyword relevance scoring,
and multi-perspective thread assembly.
"""

from bot.news_aggregator import (
    LocalNewsAggregator,
    calculate_article_relevance,
    parse_rss_xml,
)
from bot.schemas import EnrichedCivicMatter, ImpactPriority, NewsArticleContext

SAMPLE_RSS_20 = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Cleveland Scene News</title>
    <link>https://clevescene.com</link>
    <item>
      <title>City Council Debates Euclid Avenue Rezoning Plan for Retail</title>
      <link>https://clevescene.com/news/council-debates-euclid-rezoning-41234</link>
      <description><![CDATA[<p>Council members met Monday regarding <b>Ord-882-2026</b> to discuss pedestrian corridors and commercial parcels.</p>]]></description>
      <pubDate>Mon, 12 Oct 2026 14:30:00 GMT</pubDate>
    </item>
    <item>
      <title>West Side Market Renovation Moves Forward</title>
      <link>https://clevescene.com/news/west-side-market-renovation</link>
      <description>Vendors celebrate new capital funding for historic public market facilities.</description>
      <pubDate>Sun, 11 Oct 2026 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
"""

SAMPLE_ATOM_FEED = """<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Signal Cleveland Civic Beat</title>
  <entry>
    <title>What the $250k Euclid Avenue Capital Improvement Grant Means for Ward 5</title>
    <link href="https://signalcleveland.org/euclid-avenue-grant-ward-5" />
    <updated>2026-10-12T16:00:00Z</updated>
    <summary>A detailed look into Euclid Avenue commercial zoning and streetscape upgrades.</summary>
  </entry>
</feed>
"""


def test_parse_rss_20():
    articles = parse_rss_xml(SAMPLE_RSS_20, source_name="Cleveland Scene")
    assert len(articles) == 2

    first = articles[0]
    assert first.source_name == "Cleveland Scene"
    assert first.source_domain == "clevescene.com"
    assert "Euclid Avenue Rezoning" in first.title
    assert "Ord-882-2026" in first.summary_snippet
    # HTML tags should be stripped
    assert "<p>" not in first.summary_snippet


def test_parse_atom_feed():
    articles = parse_rss_xml(SAMPLE_ATOM_FEED, source_name="Signal Cleveland")
    assert len(articles) == 1

    art = articles[0]
    assert art.source_name == "Signal Cleveland"
    assert art.source_domain == "signalcleveland.org"
    assert "Ward 5" in art.title
    assert art.url == "https://signalcleveland.org/euclid-avenue-grant-ward-5"


def test_parse_malformed_xml():
    articles = parse_rss_xml("<not_valid_xml>unclosed", source_name="Broken Feed")
    assert articles == []


def test_calculate_article_relevance_file_number():
    docket = EnrichedCivicMatter(
        ocd_bill_id="ocd-bill/2026-oh-cleveland-ord-882",
        file_number="Ord-882-2026",
        plain_title="Euclid Avenue Commercial Rezoning",
        the_what="Rezoning parcels.",
        the_who="Ward 5 residents",
        fiscal_impact_amount=250000.0,
        fiscal_impact_type="Grant",
        impact_priority=ImpactPriority.HIGH,
        affected_wards=["Ward 5"],
        official_source_url="https://cleveland.legistar.com/882",
        clerk_matter_id="882",
        receipt_snippet="authorizing $250,000",
    )

    article = NewsArticleContext(
        source_name="Cleveland Scene",
        source_domain="clevescene.com",
        title="Council Approves Ord-882-2026 After Lengthy Hearing",
        url="https://clevescene.com/ord-882",
        summary_snippet="The controversial rezoning ordinance was passed.",
    )

    score, keywords = calculate_article_relevance(docket, article)
    assert score >= 0.50
    assert any("Ord-882-2026" in k for k in keywords)


def test_match_articles_to_docket_and_context_thread():
    docket = EnrichedCivicMatter(
        ocd_bill_id="ocd-bill/2026-oh-cleveland-ord-882",
        file_number="Ord-882-2026",
        plain_title="Euclid Avenue Commercial Rezoning",
        the_what="Rezoning parcels for mixed use.",
        the_who="Ward 5 residents",
        fiscal_impact_amount=250000.0,
        fiscal_impact_type="Capital Grant",
        impact_priority=ImpactPriority.HIGH,
        affected_wards=["Ward 5"],
        official_source_url="https://cleveland.legistar.com/882",
        clerk_matter_id="882",
        receipt_snippet="authorizing $250,000",
    )

    aggregator = LocalNewsAggregator()
    all_articles = parse_rss_xml(SAMPLE_RSS_20, source_name="Cleveland Scene") + parse_rss_xml(
        SAMPLE_ATOM_FEED, source_name="Signal Cleveland"
    )

    matched = aggregator.match_articles_to_docket(docket, all_articles, min_relevance=0.40)
    assert len(matched) >= 1
    assert matched[0].relevance_score >= 0.40

    thread = aggregator.build_context_thread(docket, all_articles, min_relevance=0.40)
    assert thread.has_multi_perspective is True
    assert len(thread.matched_articles) >= 1
    assert thread.official_docket_url == docket.official_source_url
