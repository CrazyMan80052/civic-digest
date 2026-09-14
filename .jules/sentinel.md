## 2024-05-24 - [Overly Permissive CORS Configuration]
**Vulnerability:** The FastAPI backend had `allow_origins=["*"]` combined with `allow_credentials=True` in `backend/main.py`.
**Learning:** This combination exposes the API to CSRF and data leakage vulnerabilities because any website can make credentialed requests. FastAPI/Starlette actually disallow this combination, so it is both insecure and prone to breaking.
**Prevention:** Always restrict `allow_origins` to known frontend domains via environment variables, especially when credentials (cookies, auth headers) are permitted.

## 2025-03-05 - Replace stdlib ElementTree with defusedxml to prevent XXE
**Vulnerability:** The RSS parser in `backend/bot/news_aggregator.py` used `xml.etree.ElementTree` to parse external XML feeds, exposing the system to XML External Entity (XXE) injection attacks since stdlib `xml` is vulnerable to billion laughs and XXE.
**Learning:** External or untrusted XML input MUST NEVER be parsed using Python's standard `xml.etree.ElementTree` or `minidom` directly.
**Prevention:** Always use `defusedxml.ElementTree` when dealing with untrusted XML data.
