import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.api.routes import router
from app.core.config import get_settings

settings = get_settings()
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.requests_per_minute}/minute"])

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Vanity AI Advisor API", version="0.1.0")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# This MUST be the very first middleware added — right after app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://mog-ai.vercel.app",                     # production
        # For preview branches (optional but recommended):
        "https://mog-ai-git-codex-build-vanity-ai-adv-1c4e62-nikolarins-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # 24 hours — helps caching preflight
)

# ONLY AFTER the line above — add your routers, event handlers, etc.
# from .api.routes import router
# app.include_router(router, prefix="/api/v1")

# ONLY AFTER the line above — add your routers, event handlers, etc.
# from .api.routes import router
# app.include_router(router, prefix="/api/v1")

allowed_origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]
for required_origin in (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://mog-ai.vercel.app",
):
    if required_origin not in allowed_origins:
        allowed_origins.append(required_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https://mog-ai(-git-.*-nikolarins-projects)?\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(status_code=429, content={"detail": str(exc)})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(router)
