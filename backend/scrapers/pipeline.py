# backend/scrapers/pipeline.py
"""
Scraper & Ingestion Pipeline Orchestrator
Coordinates fetching, OCD normalization, AI enrichment, and database persistence.
"""

import logging
from datetime import UTC, datetime
from typing import Any

try:
    from ..database import SessionLocal
    from ..models import Bill, PrimarySourceReceipt
    from .dublin import DublinMunicipalClient
    from .legistar import LegistarClient
    from .normalizer import normalize_legistar_matter
except (ImportError, ValueError):
    from database import SessionLocal
    from models import Bill, PrimarySourceReceipt
    from scrapers.dublin import DublinMunicipalClient
    from scrapers.legistar import LegistarClient
    from scrapers.normalizer import normalize_legistar_matter

logger = logging.getLogger("civicdigest.pipeline")

class IngestionPipeline:
    def __init__(self, jurisdiction_id: str, client_name: str, state_code: str, place_name: str):
        self.jurisdiction_id = jurisdiction_id
        self.client_name = client_name
        self.state_code = state_code
        self.place_name = place_name
        if client_name.lower() == "dublin" or place_name.lower() == "dublin":
            self.client = DublinMunicipalClient()
        else:
            self.client = LegistarClient(client_name=client_name)

    async def run(self, top: int = 15, days_back: int = 30) -> dict[str, Any]:
        """
        Executes a complete scrape, normalization, and ingestion run.
        """
        start_time = datetime.now(UTC)
        stats = {
            "jurisdiction": self.place_name,
            "status": "running",
            "total_fetched": 0,
            "new_dockets": 0,
            "skipped_duplicates": 0,
            "enriched_dockets": [],
            "errors": [],
        }

        try:
            raw_matters = await self.client.fetch_recent_matters(days_back=days_back, top=top)
            stats["total_fetched"] = len(raw_matters)

            if not raw_matters:
                stats["status"] = "completed (no new records from remote OData)"
                return stats

            normalized_list = [
                normalize_legistar_matter(
                    raw=raw,
                    jurisdiction_id=self.jurisdiction_id,
                    state_code=self.state_code,
                    place_name=self.place_name,
                )
                for raw in raw_matters
            ]
            stats["enriched_dockets"] = normalized_list
            stats["new_dockets"] = len(normalized_list)

            try:
                db = SessionLocal()
                try:
                    persisted_count = 0
                    for normalized in normalized_list:
                        existing = db.query(Bill).filter(Bill.id == normalized["id"]).first()
                        if existing:
                            stats["skipped_duplicates"] += 1
                            continue

                        # Insert new Bill
                        bill_record = Bill(
                            id=normalized["id"],
                            jurisdiction_id=normalized["jurisdictionId"],
                            file_number=normalized["fileNumber"],
                            official_title=normalized["officialTitle"],
                            plain_title=normalized["plainTitle"],
                            category=normalized["category"],
                            status=normalized["status"],
                            introduction_date=datetime.strptime(normalized["introductionDate"], "%Y-%m-%d").date(),
                            sponsors=normalized["sponsors"],
                            affected_wards=normalized["affectedWards"],
                            who_it_affects=normalized["whoItAffects"],
                            summary=normalized["summary"],
                            fiscal_amount=normalized["fiscalImpact"]["amount"],
                            fiscal_type=normalized["fiscalImpact"]["type"],
                            fiscal_description=normalized["fiscalImpact"]["description"],
                            committee_name=normalized["hearing"]["committee"],
                            location=normalized["hearing"]["location"],
                            tags=normalized["tags"],
                        )
                        db.add(bill_record)

                        # Insert Receipt Anchor
                        receipt_record = PrimarySourceReceipt(
                            bill_id=normalized["id"],
                            file_number=normalized["fileNumber"],
                            clerk_matter_id=normalized["receipt"]["clerkMatterId"],
                            document_title=normalized["receipt"]["documentTitle"],
                            official_url=normalized["receipt"]["officialUrl"],
                            paragraph_snippet=normalized["receipt"]["paragraphSnippet"],
                            page_number=normalized["receipt"]["pageNumber"],
                            verification_badge=normalized["receipt"]["verificationBadge"],
                        )
                        db.add(receipt_record)
                        persisted_count += 1

                    db.commit()
                    stats["new_dockets"] = persisted_count
                    stats["status"] = "completed"
                except Exception as db_err:
                    db.rollback()
                    logger.warning(f"Database commit bypassed or skipped: {db_err}")
                    stats["status"] = "completed_in_memory"
                finally:
                    db.close()
            except Exception as conn_err:
                logger.warning(f"Database connection skipped: {conn_err}")
                stats["status"] = "completed_in_memory"

        except Exception as e:
            stats["status"] = "failed"
            stats["errors"].append(str(e))
            logger.error(f"Pipeline error for {self.place_name}: {e}")

        stats["duration_seconds"] = (datetime.now(UTC) - start_time).total_seconds()
        return stats
