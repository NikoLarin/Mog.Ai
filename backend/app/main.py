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

app = FastAPI(title="Vanity AI Advisor API", version="0.1.0")

allowed_origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]
if "http://localhost:3000" not in allowed_origins:
    allowed_origins.append("http://localhost:3000")
if "https://mog-ai-git-codex-build-vanity-ai-adv-1c4e62-nikolarins-projects.vercel.app" not in allowed_origins:
    allowed_origins.append("https://mog-ai-git-codex-build-vanity-ai-adv-1c4e62-nikolarins-projects.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
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
