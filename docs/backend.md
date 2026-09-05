# Backend Documentation

The backend of CivicDigest is a standalone Python microservice built with **FastAPI**. It handles web scraping, OCR pipelines, NLP enrichment, and differential privacy.

## Tech Stack

- **Framework:** FastAPI
- **Database:** PostgreSQL (with SQLAlchemy ORM)
- **Scraping:** Custom Legistar OData client & Ingestion Pipeline
- **API Standard:** Open Civic Data (OCD-ID v3)

## Features

- **Health Check Endpoint:** `/api/health`
- **Scraper Trigger Endpoint:** `/api/scrapers/run`
- **Legistar OData Preview:** `/api/scrapers/preview-odata`

## Getting Started

The backend connects to a database using the `DATABASE_URL` environment variable (as defined in `.env.example`). If not provided, it falls back to mock OCD datasets.

To run the backend development server (assuming standard Python/Uvicorn setup):

```bash
cd backend
pip install -r requirements.txt # (Ensure dependencies are installed)
uvicorn main:app --reload
```

## Scraper Pipeline

The scraper subsystem collects, normalizes, and stores municipal legislative data from official government portals. It follows the Open Civic Data (OCD-ID v3) standard and implements the Receipt Verification Protocol to ensure provenance and auditability.

### Architecture & Components

```
┌─────────────────────────┐
│ Granicus / Legistar API │ (OData v1 Web API)
└───────────┬─────────────┘
            │ HTTP (OData Queries)
            ▼
┌─────────────────────────┐
│     LegistarClient      │ backend/scrapers/legistar.py
└───────────┬─────────────┘
            │ Raw Matter & Event JSON
            ▼
┌─────────────────────────┐
│       Normalizer        │ backend/scrapers/normalizer.py
│  - HTML Sanitization    │
│  - OCD-ID Generation    │
│  - Topic Categorization │
│  - Receipt Anchoring    │
└───────────┬─────────────┘
            │ OCD-compliant Entities
            ▼
┌─────────────────────────┐
│    IngestionPipeline    │ backend/scrapers/pipeline.py
│  - Deduplication        │
│  - DB Persistence       │
│  - In-Memory Fallback   │
└───────────┬─────────────┘
            │ SQLAlchemy ORM
            ▼
┌─────────────────────────┐
│ PostgreSQL (bills, etc.)│
└─────────────────────────┘
```

#### 1. Legistar Client (`backend/scrapers/legistar.py`)

Handles asynchronous HTTP communication with Granicus Legistar Web APIs:
- **Base URL:** `https://webapi.legistar.com/v1/{client_name}`
- **`fetch_recent_matters(days_back=30, top=50)`:** Queries the `/matters` endpoint using OData parameters (`$filter=MatterIntroDate ge datetime'...'`, `$orderby=MatterIntroDate desc`, and `$top`).
- **`fetch_matter_attachments(matter_id)`:** Retrieves official PDF attachments, fiscal notes, and committee reports from `/matters/{matter_id}/attachments`.
- **`fetch_upcoming_events(days_ahead=14)`:** Queries `/events` with date bounds for city council and committee meeting agendas.

#### 2. Normalizer (`backend/scrapers/normalizer.py`)

Transforms vendor-specific payloads into standard CivicDigest OCD-ID structures:
- **HTML Sanitization:** Strips HTML formatting tags and collapses extra whitespace via `clean_html_text`.
- **OCD-ID v3 Generation:** Generates deterministic identifiers using `generate_ocd_bill_id`:
  ```
  ocd-bill/{year}-{state}-{place}-{clean_file_number}
  ```
  Example: `ocd-bill/2026-oh-cleveland-ord-882`
- **Categorization Heuristics:** Evaluates bill titles against keyword dictionaries to classify matters into standard civic policy categories:
  - `Zoning & Land Use` (e.g., zoning, variance, parcel, land use, subdivision)
  - `Environment & Infrastructure` (e.g., storm, sewer, water, park, climate, solar)
  - `Budget & Appropriations` (e.g., budget, appropriation, tax, bond, grant, fiscal)
  - `Public Safety & Justice` (e.g., police, fire, ems, safety, surveillance)
  - `Transit & Mobility` (e.g., transit, bus, bike, street, traffic, signal)
  - `General Municipal Policy` (default fallback)
- **Primary Source Receipt Anchoring:** Generates receipt metadata with clerk matter IDs, official Legistar detail URLs, verification badges, and timestamps to eliminate hallucination risk.

#### 3. Ingestion Pipeline Orchestrator (`backend/scrapers/pipeline.py`)

Coordinates end-to-end execution of a scraping job:
- Fetches recent matters via `LegistarClient`.
- Normalizes records into OCD schema dictionaries.
- Deduplicates against the database by checking existing `Bill.id` records.
- Inserts new `Bill` and `PrimarySourceReceipt` entities within a database transaction.
- Catches database errors and falls back to `completed_in_memory` mode if PostgreSQL is unavailable.
- Collects execution statistics (`total_fetched`, `new_dockets`, `skipped_duplicates`, `duration_seconds`).

---

## API Reference

### Health Check

- **Endpoint:** `GET /api/health`
- **Description:** Checks service status and returns supported standards.
- **Response:**
  ```json
  {
    "status": "healthy",
    "service": "CivicDigest-FastAPI-Engine",
    "timestamp": "2026-09-04T20:00:00.000000",
    "standards": ["Open Civic Data OCD-ID v3", "Legistar OData", "Laplace DP"]
  }
  ```

### Trigger Scraper

- **Endpoint:** `POST /api/scrapers/run`
- **Description:** Initiates a live scrape, normalizes records, and persists them to the database.
- **Request Body:**
  ```json
  {
    "client_name": "cleveland",
    "state_code": "OH",
    "place_name": "Cleveland",
    "top": 15,
    "days_back": 30
  }
  ```
- **Response:**
  ```json
  {
    "jurisdiction": "Cleveland",
    "status": "completed",
    "total_fetched": 15,
    "new_dockets": 12,
    "skipped_duplicates": 3,
    "enriched_dockets": [...],
    "errors": [],
    "duration_seconds": 1.84
  }
  ```

### Preview Legistar OData

- **Endpoint:** `GET /api/scrapers/preview-odata`
- **Description:** Inspects raw OData records directly from the city's Legistar endpoint for verification.
- **Query Parameters:**
  - `client_name` (string, default: `"cleveland"`): Legistar client ID (e.g., `cleveland`, `austin`, `seattle`).
  - `top` (integer, default: `5`): Maximum records to retrieve (1 to 20).
- **Response:**
  ```json
  {
    "client": "cleveland",
    "count": 5,
    "endpoint": "https://webapi.legistar.com/v1/cleveland/matters",
    "records": [...]
  }
  ```

