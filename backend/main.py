# backend/main.py
"""
FastAPI Entry Point for CivicDigest Backend Service
Exposes endpoints for Scrapers, OCR Pipeline, NLP Enrichment, and Differential Privacy.
"""

from fastapi import FastAPI, Depends, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import asyncio
from datetime import datetime

from .database import get_db, Base, engine
from .models import Jurisdiction, Bill, PrimarySourceReceipt
from .scrapers.pipeline import IngestionPipeline
from .scrapers.legistar import LegistarClient

# Initialize DB tables if PostgreSQL is available
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"PostgreSQL initialization deferred: {e}")

app = FastAPI(
    title="CivicDigest Civic-Tech Scraper & Analytics API",
    description="Open Civic Data (OCD-ID) scraper, NLP enrichment pipeline, and municipal transparency service.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeTriggerRequest(BaseModel):
    client_name: str = Field(..., example="cleveland", description="Municipal Legistar identifier")
    state_code: str = Field(default="OH", example="OH")
    place_name: str = Field(default="Cleveland", example="Cleveland")
    top: int = Field(default=15, ge=1, le=100)
    days_back: int = Field(default=30, ge=1, le=180)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "CivicDigest-FastAPI-Engine",
        "timestamp": datetime.utcnow().isoformat(),
        "standards": ["Open Civic Data OCD-ID v3", "Legistar OData", "Laplace DP"],
    }

@app.post("/api/scrapers/run")
async def trigger_scraper(request: ScrapeTriggerRequest):
    """
    Executes a live scrape run for a given municipality, normalizes matters to OCD-ID,
    and returns ingestion stats.
    """
    jurisdiction_id = f"ocd-jurisdiction/country:us/state:{request.state_code.lower()}/place:{request.place_name.lower()}/government"
    
    pipeline = IngestionPipeline(
        jurisdiction_id=jurisdiction_id,
        client_name=request.client_name,
        state_code=request.state_code,
        place_name=request.place_name,
    )
    
    results = await pipeline.run(top=request.top, days_back=request.days_back)
    return results

@app.get("/api/scrapers/preview-odata")
async def preview_legistar_odata(
    client_name: str = Query("cleveland", description="Legistar client ID (e.g., 'cleveland', 'austin', 'seattle')"),
    top: int = Query(5, ge=1, le=20)
):
    """
    Quick inspection endpoint to fetch raw Legistar OData records directly from the city's public API.
    """
    client = LegistarClient(client_name=client_name)
    raw = await client.fetch_recent_matters(days_back=60, top=top)
    return {
        "client": client_name,
        "count": len(raw),
        "endpoint": f"https://webapi.legistar.com/v1/{client_name}/matters",
        "records": raw,
    }
