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

The ingestion pipeline handles the actual scraping of municipal data (e.g., from Legistar) and maps the results to Open Civic Data (OCD-ID) standards for uniformity and ease of use.
