## 2024-05-24 - [Overly Permissive CORS Configuration]
**Vulnerability:** The FastAPI backend had `allow_origins=["*"]` combined with `allow_credentials=True` in `backend/main.py`.
**Learning:** This combination exposes the API to CSRF and data leakage vulnerabilities because any website can make credentialed requests. FastAPI/Starlette actually disallow this combination, so it is both insecure and prone to breaking.
**Prevention:** Always restrict `allow_origins` to known frontend domains via environment variables, especially when credentials (cookies, auth headers) are permitted.
