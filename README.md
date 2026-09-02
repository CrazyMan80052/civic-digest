# CivicDigest

CivicDigest is a civic-tech platform designed to provide a municipal transparency service. It consists of a web frontend for users and a Python scraping/analytics microservice for collecting and standardizing public records.

## Project Structure

This repository is a monorepo containing two main projects:

- **Frontend:** A Next.js (App Router) web application.
- **Backend:** A FastAPI Python service for web scraping, NLP enrichment, and Open Civic Data (OCD-ID) normalization.

## Quick Start

### Frontend (Next.js)

The frontend uses the [Bun](https://bun.sh/) runtime.

```bash
cd frontend
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Backend (FastAPI)

The backend requires Python and standard dependencies.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at [http://localhost:8000](http://localhost:8000). You can check the health endpoint at `/api/health`.

## Documentation

For more detailed information about the frontend configuration, backend architecture, API endpoints, and development rules, please refer to the documentation:

- [Documentation Site](https://docs.civicdigest.com) *(Update this link to your GitHub Pages URL once deployed)*
- Alternatively, you can browse the raw Markdown files in the `docs/` directory of this repository.

To preview the documentation locally:
```bash
pip install mkdocs mkdocs-material
mkdocs serve
```
