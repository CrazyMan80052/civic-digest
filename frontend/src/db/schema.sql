-- ==============================================================================
-- CivicDigest - Open Civic Data (OCD-ID) PostgreSQL Database Schema
-- Version: 1.0.0
-- Compatible with PostgreSQL 14+, Neon, Supabase, Cloud SQL, AWS RDS
-- ==============================================================================

-- Enable UUID and vector/trigram extensions if supported
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. JURISDICTIONS TABLE (Open Civic Data OCD-ID Standard)
CREATE TABLE IF NOT EXISTS jurisdictions (
    id VARCHAR(128) PRIMARY KEY, -- e.g. 'ocd-jurisdiction/country:us/state:oh/place:cleveland/government'
    name VARCHAR(255) NOT NULL,
    classification VARCHAR(64) DEFAULT 'municipality',
    state_code VARCHAR(2) NOT NULL,
    division_id VARCHAR(128) NOT NULL,
    council_size INT DEFAULT 17,
    next_hearing_date TIMESTAMPTZ,
    active_ordinance_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. COUNCIL MEMBERS & OFFICIALS TABLE
CREATE TABLE IF NOT EXISTS council_members (
    id VARCHAR(128) PRIMARY KEY, -- e.g. 'ocd-person/cleveland-councildistrict-15'
    jurisdiction_id VARCHAR(128) REFERENCES jurisdictions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    ward_or_district VARCHAR(64) NOT NULL,
    title VARCHAR(128) DEFAULT 'Council Member',
    committee_assignments JSONB DEFAULT '[]', -- Array of committee names
    attendance_rate NUMERIC(5,2) DEFAULT 95.0,
    sponsored_bills_count INT DEFAULT 0,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. BILLS, DOCKETS & ORDINANCES TABLE
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(128) PRIMARY KEY, -- e.g. 'ocd-bill/2026-cleveland-ord-882'
    jurisdiction_id VARCHAR(128) REFERENCES jurisdictions(id) ON DELETE CASCADE,
    file_number VARCHAR(64) NOT NULL, -- e.g. 'Ord. 882-2026'
    official_title TEXT NOT NULL,
    plain_title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'Zoning & Land Use', 'Environment & Infrastructure', etc.
    status VARCHAR(64) NOT NULL DEFAULT 'In Committee', -- 'Passed', 'In Committee', 'Hearing Scheduled', etc.
    introduction_date DATE NOT NULL,
    next_action_date DATE,
    sponsors JSONB DEFAULT '[]', -- Array of sponsor names/IDs
    affected_wards JSONB DEFAULT '[]', -- e.g. [12, 13, 15] or ["All Wards"]
    who_it_affects TEXT,
    summary TEXT NOT NULL,
    
    -- Fiscal Impact Object
    fiscal_amount NUMERIC(15,2) DEFAULT 0.00,
    fiscal_type VARCHAR(64) DEFAULT 'One-Time Capital', -- 'One-Time Capital', 'Tax Abatement', 'Regulatory'
    fiscal_description TEXT,
    
    -- Committee & Hearing info
    committee_name VARCHAR(128),
    location VARCHAR(255),
    
    -- Multi-Perspective Analysis Cache
    perspectives_cache JSONB,
    
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching bills by category, jurisdiction, and text
CREATE INDEX IF NOT EXISTS idx_bills_jurisdiction ON bills(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_file_number ON bills(file_number);

-- 4. PRIMARY SOURCE CITATION RECEIPTS TABLE (Grounded in Clerk Journals)
CREATE TABLE IF NOT EXISTS primary_source_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id VARCHAR(128) UNIQUE REFERENCES bills(id) ON DELETE CASCADE,
    file_number VARCHAR(64) NOT NULL,
    clerk_matter_id VARCHAR(64) NOT NULL,
    document_title VARCHAR(255) NOT NULL,
    official_url TEXT NOT NULL,
    paragraph_snippet TEXT NOT NULL,
    page_number INT DEFAULT 1,
    verification_badge VARCHAR(64) DEFAULT 'Verified Clerk Journal',
    verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. ROLL CALL VOTES TABLE
CREATE TABLE IF NOT EXISTS vote_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id VARCHAR(128) REFERENCES bills(id) ON DELETE CASCADE,
    member_id VARCHAR(128) REFERENCES council_members(id) ON DELETE CASCADE,
    vote_cast VARCHAR(16) NOT NULL, -- 'Aye', 'Nay', 'Abstain', 'Absent'
    vote_date DATE NOT NULL,
    session_title VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vote_records_bill ON vote_records(bill_id);
CREATE INDEX IF NOT EXISTS idx_vote_records_member ON vote_records(member_id);

-- 6. PUBLIC HEARINGS & MEETINGS TABLE
CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(128) PRIMARY KEY,
    jurisdiction_id VARCHAR(128) REFERENCES jurisdictions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    committee VARCHAR(128) NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    location VARCHAR(255) NOT NULL,
    agenda_url TEXT,
    minutes_url TEXT,
    docket_ids JSONB DEFAULT '[]', -- Array of referenced bill IDs
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. RESIDENT SENTIMENT & DIFFERENTIAL PRIVACY PULSE TABLE
-- Stores raw zero-party civic feedback; queries are always protected by Laplace noise
CREATE TABLE IF NOT EXISTS resident_sentiment_pulse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_id VARCHAR(128) REFERENCES jurisdictions(id) ON DELETE CASCADE,
    ward_district VARCHAR(64) NOT NULL,
    topic VARCHAR(64) NOT NULL, -- 'housing_cost', 'infrastructure', 'public_safety', 'transit'
    sentiment_score NUMERIC(3,2) NOT NULL, -- -1.00 (strongly negative) to +1.00 (strongly positive)
    burden_level VARCHAR(32), -- 'Low', 'Moderate', 'Severe'
    demographic_group VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resident_sentiment_topic ON resident_sentiment_pulse(topic);
CREATE INDEX IF NOT EXISTS idx_resident_sentiment_ward ON resident_sentiment_pulse(ward_district);

-- 8. SOCIAL MEDIA BROADCAST DISPATCH AUDIT LOG
CREATE TABLE IF NOT EXISTS social_broadcast_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id VARCHAR(128) REFERENCES bills(id) ON DELETE SET NULL,
    platform VARCHAR(32) NOT NULL, -- 'twitter', 'bluesky', 'threads', 'linkedin', 'instagram', 'webhook'
    content_text TEXT NOT NULL,
    dispatched_by VARCHAR(128) DEFAULT 'editorial_bot',
    status VARCHAR(32) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
