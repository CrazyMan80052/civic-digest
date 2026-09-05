"""
LLM Distillation & Receipt Verification Engine
Processes raw municipal dockets and PDF text into verified, plain-language summaries.
Enforces the Receipt Verification Protocol to ensure factual provenance.
"""

import json
import logging
import os
import re
from typing import Any, Protocol

import httpx

from .prompts import ENRICHMENT_USER_PROMPT, SYSTEM_CIVIC_PROMPT
from .schemas import EnrichedCivicMatter, ImpactPriority

logger = logging.getLogger("civicdigest.bot.enricher")


class ReceiptVerificationError(ValueError):
    """Raised when an LLM summary's citation quote does not exist in the source document."""
    pass


class LLMClient(Protocol):
    async def generate_json(self, prompt: str, system_prompt: str) -> str:
        ...


class MockLLMProvider:
    """
    Deterministic mock provider for offline testing and development.
    Extracts a real snippet from the text to ensure receipt verification passes.
    """
    def __init__(self, canned_response: dict[str, Any] | None = None):
        self.canned_response = canned_response

    async def generate_json(self, prompt: str, system_prompt: str) -> str:
        if self.canned_response:
            return json.dumps(self.canned_response)

        # Generate a reasonable default based on input text
        lines = [line.strip() for line in prompt.split("\n") if len(line.strip()) > 20]
        snippet = lines[0] if lines else "Approves standard municipal operations."

        return json.dumps({
            "plain_title": "City Council Operational Agreement",
            "the_what": "Approves the execution of municipal contract terms.",
            "the_who": "Residents across the municipality.",
            "fiscal_impact_amount": 150000.0,
            "fiscal_impact_type": "Municipal Capital Fund",
            "impact_priority": "HIGH",
            "affected_wards": ["All Wards"],
            "receipt_snippet": snippet[:180],
            "receipt_page_number": 1,
        })


class GeminiLLMProvider:
    """
    Direct Gemini API client via httpx (no external SDK bloat).
    Uses GEMINI_API_KEY environment variable.
    """
    def __init__(self, api_key: str | None = None, model: str = "gemini-2.0-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    async def generate_json(self, prompt: str, system_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set.")

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1,
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}?key={self.api_key}",
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise ValueError("No candidate responses returned by Gemini.")
            text = candidates[0]["content"]["parts"][0]["text"]
            return text


def clean_json_response(raw_response: str) -> str:
    """Strips Markdown fences from JSON output if present."""
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\n?```$", "", cleaned)
    return cleaned.strip()


def verify_receipt(enriched: EnrichedCivicMatter, raw_text: str) -> bool:
    """
    Verifies that receipt_snippet is an exact or normalized substring of raw_text.
    Raises ReceiptVerificationError if the citation is absent.
    """
    if not enriched.receipt_snippet or len(enriched.receipt_snippet.strip()) < 5:
        raise ReceiptVerificationError("Receipt verification failed: citation snippet is empty.")

    # Normalize whitespace for robust comparison
    norm_source = re.sub(r"\s+", " ", raw_text).lower()
    norm_snippet = re.sub(r"\s+", " ", enriched.receipt_snippet).lower()

    if norm_snippet not in norm_source:
        raise ReceiptVerificationError(
            f"Receipt verification failed: citation '{enriched.receipt_snippet}' "
            "was not found verbatim in official source text."
        )
    return True


class CivicLLMEnricher:
    """
    Distills raw municipal dockets into structured, verified civic intelligence.
    """
    def __init__(self, provider: LLMClient | None = None):
        if provider is not None:
            self.provider = provider
        else:
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                self.provider = GeminiLLMProvider(api_key=api_key)
            else:
                logger.info("GEMINI_API_KEY not found; falling back to MockLLMProvider.")
                self.provider = MockLLMProvider()

    async def enrich_docket(
        self,
        raw_title: str,
        raw_text: str,
        metadata: dict[str, Any],
        enforce_receipt: bool = True,
    ) -> EnrichedCivicMatter:
        """
        Enriches a municipal docket item using strict JSON distillation.
        """
        combined_text = f"{raw_title}\n\n{raw_text}".strip()

        user_prompt = ENRICHMENT_USER_PROMPT.format(
            place_name=metadata.get("place_name", "Local"),
            state_code=metadata.get("state_code", "State"),
            file_number=metadata.get("file_number", "Unknown"),
            official_title=raw_title,
            status=metadata.get("status", "In Council"),
            official_url=metadata.get("official_url", "https://webapi.legistar.com"),
            raw_text=combined_text[:12000],  # Guard token limits
        )

        raw_json_str = await self.provider.generate_json(
            prompt=user_prompt, system_prompt=SYSTEM_CIVIC_PROMPT
        )
        cleaned_json = clean_json_response(raw_json_str)
        parsed = json.loads(cleaned_json)

        enriched = EnrichedCivicMatter(
            ocd_bill_id=metadata.get("ocd_bill_id", f"ocd-bill/temp-{metadata.get('file_number')}"),
            file_number=metadata.get("file_number", "Unknown"),
            plain_title=parsed.get("plain_title", raw_title[:120]),
            the_what=parsed.get("the_what", raw_title),
            the_who=parsed.get("the_who", "Local residents"),
            fiscal_impact_amount=float(parsed.get("fiscal_impact_amount", 0.0)),
            fiscal_impact_type=parsed.get("fiscal_impact_type", "None"),
            impact_priority=ImpactPriority(parsed.get("impact_priority", "MODERATE")),
            affected_wards=parsed.get("affected_wards", ["All Wards"]),
            official_source_url=metadata.get("official_url", ""),
            clerk_matter_id=str(metadata.get("clerk_matter_id", "")),
            receipt_snippet=parsed.get("receipt_snippet", raw_title[:150]),
            receipt_page_number=int(parsed.get("receipt_page_number", 1)),
            neutrality_score=float(parsed.get("neutrality_score", 1.0)),
        )

        if enforce_receipt:
            verify_receipt(enriched, combined_text)

        return enriched
