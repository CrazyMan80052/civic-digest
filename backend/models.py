# backend/models.py
import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

try:
    from .database import Base
except ImportError:
    from database import Base

class Jurisdiction(Base):
    __tablename__ = "jurisdictions"

    id = Column(String(128), primary_key=True) # OCD-ID
    name = Column(String(255), nullable=False)
    classification = Column(String(64), default="municipality")
    state_code = Column(String(2), nullable=False)
    division_id = Column(String(128), nullable=False)
    council_size = Column(Integer, default=17)
    next_hearing_date = Column(DateTime(timezone=True))
    active_ordinance_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Bill(Base):
    __tablename__ = "bills"

    id = Column(String(128), primary_key=True) # OCD-ID
    jurisdiction_id = Column(String(128), ForeignKey("jurisdictions.id", ondelete="CASCADE"))
    file_number = Column(String(64), nullable=False)
    official_title = Column(Text, nullable=False)
    plain_title = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False)
    status = Column(String(64), default="In Committee")
    introduction_date = Column(Date, nullable=False)
    next_action_date = Column(Date)
    sponsors = Column(JSONB, default=[])
    affected_wards = Column(JSONB, default=[])
    who_it_affects = Column(Text)
    summary = Column(Text, nullable=False)
    fiscal_amount = Column(Numeric(15, 2), default=0.00)
    fiscal_type = Column(String(64), default="One-Time Capital")
    fiscal_description = Column(Text)
    committee_name = Column(String(128))
    location = Column(String(255))
    tags = Column(JSONB, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PrimarySourceReceipt(Base):
    __tablename__ = "primary_source_receipts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bill_id = Column(String(128), ForeignKey("bills.id", ondelete="CASCADE"), unique=True)
    file_number = Column(String(64), nullable=False)
    clerk_matter_id = Column(String(64), nullable=False)
    document_title = Column(String(255), nullable=False)
    official_url = Column(Text, nullable=False)
    paragraph_snippet = Column(Text, nullable=False)
    page_number = Column(Integer, default=1)
    verification_badge = Column(String(64), default="Verified Clerk Journal")
    verified_at = Column(DateTime(timezone=True), server_default=func.now())

class ResidentSentiment(Base):
    __tablename__ = "resident_sentiment_pulse"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jurisdiction_id = Column(String(128), ForeignKey("jurisdictions.id", ondelete="CASCADE"))
    ward_district = Column(String(64), nullable=False)
    topic = Column(String(64), nullable=False)
    sentiment_score = Column(Numeric(3, 2), nullable=False)
    burden_level = Column(String(32))
    demographic_group = Column(String(64))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
