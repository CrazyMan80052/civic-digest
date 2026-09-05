"""
Multi-Perspective Local News Aggregator & Context Matcher
Scrapes local municipal news RSS feeds using Python standard library XML parsing
and pairs ingested dockets with balanced media coverage.
"""

import logging
import re
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

import httpx

from .schemas import DocketContextThread, EnrichedCivicMatter, NewsArticleContext

logger = logging.getLogger("civicdigest.bot.news")

# Common stop words to exclude during keyword extraction
STOP_WORDS = {
    "about", "after", "again", "against", "all", "also", "and", "another", "any", "are",
    "because", "been", "before", "being", "between", "both", "but", "by", "can", "could",
    "city", "council", "for", "from", "further", "had", "has", "have", "having", "here",
    "into", "itself", "just", "more", "most", "ordinance", "resolution", "other", "our",
    "over", "said", "same", "should", "some", "such", "than", "that", "the", "their",
    "then", "there", "these", "they", "this", "those", "through", "under", "until", "very",
    "was", "were", "what", "when", "where", "which", "while", "who", "whom", "will", "with",
}


def parse_rss_xml(xml_content: str, source_name: str) -> list[NewsArticleContext]:
    """
    Parses RSS 2.0 or Atom XML text into normalized NewsArticleContext objects.
    Uses stdlib xml.etree.ElementTree for zero dependency overhead.
    """
    articles: list[NewsArticleContext] = []
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        logger.warning(f"Failed to parse RSS XML for {source_name}: {e}")
        return articles

    # Case 1: Standard RSS 2.0 (<rss><channel><item>...)
    items = root.findall(".//item")
    if items:
        for item in items:
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            description = (item.findtext("description") or "").strip()
            pub_date = item.findtext("pubDate")

            # Strip basic HTML tags from description if present
            clean_desc = re.sub(r"<[^>]+>", " ", description).strip()
            clean_desc = re.sub(r"\s+", " ", clean_desc)

            if title and link:
                domain = urlparse(link).netloc or source_name.lower().replace(" ", "") + ".com"
                articles.append(
                    NewsArticleContext(
                        source_name=source_name,
                        source_domain=domain,
                        title=title,
                        url=link,
                        published_date=pub_date,
                        summary_snippet=clean_desc[:300],
                        relevance_score=0.0,
                    )
                )
        return articles

    # Case 2: Atom feed (<feed><entry>...)
    entries = root.findall(".//{http://www.w3.org/2005/Atom}entry")
    if not entries:
        entries = root.findall(".//entry")

    for entry in entries:
        title_el = entry.find("{http://www.w3.org/2005/Atom}title")
        if title_el is None:
            title_el = entry.find("title")
        title = (title_el.text if title_el is not None and title_el.text else "").strip()

        link_el = entry.find("{http://www.w3.org/2005/Atom}link")
        if link_el is None:
            link_el = entry.find("link")
        link = ""
        if link_el is not None:
            link = link_el.attrib.get("href") or link_el.text or ""

        summary_el = entry.find("{http://www.w3.org/2005/Atom}summary")
        if summary_el is None:
            summary_el = entry.find("{http://www.w3.org/2005/Atom}content")
        if summary_el is None:
            summary_el = entry.find("summary")
        summary = (summary_el.text if summary_el is not None and summary_el.text else "").strip()
        clean_summary = re.sub(r"<[^>]+>", " ", summary).strip()

        pub_el = entry.find("{http://www.w3.org/2005/Atom}updated")
        if pub_el is None:
            pub_el = entry.find("updated")
        pub_date = pub_el.text if pub_el is not None else None

        if title and link:
            domain = urlparse(link).netloc or source_name.lower().replace(" ", "") + ".com"
            articles.append(
                NewsArticleContext(
                    source_name=source_name,
                    source_domain=domain,
                    title=title,
                    url=link,
                    published_date=pub_date,
                    summary_snippet=clean_summary[:300],
                    relevance_score=0.0,
                )
            )

    return articles


def calculate_article_relevance(
    docket: EnrichedCivicMatter, article: NewsArticleContext
) -> tuple[float, list[str]]:
    """
    Computes a deterministic relevance score [0.0 - 1.0] matching news to legislation.
    """
    matched_keywords: list[str] = []
    score = 0.0

    target_text = f"{article.title} {article.summary_snippet}".lower()

    # 1. Exact file number matching (e.g. "882-2026" or "Ord-882")
    file_num_clean = re.sub(r"[^a-zA-Z0-9]", "", docket.file_number).lower()
    if file_num_clean and file_num_clean in re.sub(r"[^a-zA-Z0-9]", "", target_text):
        score += 0.50
        matched_keywords.append(f"File #{docket.file_number}")

    # 2. Key content words from plain_title (length > 4, non-stopwords)
    title_words = [
        w.lower()
        for w in re.findall(r"\b[a-zA-Z]{4,}\b", docket.plain_title)
        if w.lower() not in STOP_WORDS
    ]

    title_matches = 0
    for word in set(title_words):
        if re.search(rf"\b{re.escape(word)}\b", target_text):
            title_matches += 1
            matched_keywords.append(word)

    if title_words:
        score += min(0.35, (title_matches / len(title_words)) * 0.40)

    # 3. Ward matching
    for ward in docket.affected_wards:
        ward_clean = ward.lower()
        if ward_clean != "all wards" and ward_clean in target_text:
            score += 0.15
            matched_keywords.append(ward)

    return min(1.0, round(score, 2)), matched_keywords


class LocalNewsAggregator:
    """
    Pulls local news RSS feeds and builds multi-perspective context threads.
    """

    def __init__(self, timeout: float = 10.0):
        self.timeout = timeout
        self.headers = {"User-Agent": "CivicDigest-Bot-News/1.0 (+https://civicdigest.org)"}

    async def fetch_feed(self, feed_url: str, source_name: str) -> list[NewsArticleContext]:
        """
        Pulls a remote RSS feed asynchronously and parses articles.
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
                response = await client.get(feed_url)
                if response.status_code == 200:
                    return parse_rss_xml(response.text, source_name=source_name)
                logger.warning(
                    f"RSS feed {feed_url} returned HTTP {response.status_code}"
                )
                return []
        except Exception as e:
            logger.warning(f"Error fetching RSS feed {feed_url}: {e}")
            return []

    def match_articles_to_docket(
        self,
        docket: EnrichedCivicMatter,
        articles: list[NewsArticleContext],
        min_relevance: float = 0.45,
        max_matches: int = 3,
    ) -> list[NewsArticleContext]:
        """
        Ranks and filters relevant local news articles for a given civic matter.
        """
        matched: list[NewsArticleContext] = []

        for art in articles:
            score, keywords = calculate_article_relevance(docket, art)
            if score >= min_relevance:
                # Create a copy with the calculated relevance score and matched keywords
                ranked_article = art.model_copy(
                    update={"relevance_score": score, "matched_keywords": keywords}
                )
                matched.append(ranked_article)

        # Sort descending by relevance score
        matched.sort(key=lambda a: a.relevance_score, reverse=True)
        return matched[:max_matches]

    def build_context_thread(
        self,
        docket: EnrichedCivicMatter,
        all_articles: list[NewsArticleContext],
        min_relevance: float = 0.45,
    ) -> DocketContextThread:
        """
        Creates a unified DocketContextThread pairing the official docket with media perspectives.
        """
        matched = self.match_articles_to_docket(
            docket=docket, articles=all_articles, min_relevance=min_relevance
        )

        return DocketContextThread(
            enriched_matter=docket,
            official_docket_url=docket.official_source_url,
            matched_articles=matched,
            has_multi_perspective=len(matched) > 0,
        )
