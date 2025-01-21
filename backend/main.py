import os
from contextlib import AsyncExitStack, asynccontextmanager
from secrets import compare_digest
from typing import AsyncIterator, Callable

from fastapi import Depends, FastAPI, HTTPException, Request, Security
from fastapi.security.api_key import APIKeyHeader
from loguru import logger
from starlette.status import HTTP_403_FORBIDDEN

from .routers import ner, public, punctuation

# API key configuration
API_KEY_NAME = "X-API-Key"
API_KEY = os.getenv("FASTAPI_KEY")
if not API_KEY:
    raise RuntimeError("FASTAPI_KEY environment variable must be set")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


# Define public paths
PUBLIC_PATHS = frozenset({"/public", "/docs", "/redoc", "/openapi.json", "/health"})


async def verify_api_key(request: Request, api_key_header: str = Security(api_key_header)) -> str:
    # Check if the path starts with any public path
    if any(request.url.path.startswith(path) for path in PUBLIC_PATHS):
        return None

    # For all other paths, verify API key
    if api_key_header and compare_digest(api_key_header, API_KEY):
        return api_key_header
    raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Could not validate API key")


@asynccontextmanager
async def lifespan_main(app: FastAPI) -> AsyncIterator[None]:
    logger.debug("Lifespan Main Start")
    yield
    logger.debug("Lifespan Main End")


def app_lifespan(lifespans: list[Callable[[FastAPI], AsyncIterator]]):
    @asynccontextmanager
    async def _lifespan_manager(app: FastAPI):
        exit_stack = AsyncExitStack()
        async with exit_stack:
            for lifespan in lifespans:
                await exit_stack.enter_async_context(lifespan(app))
            yield

    return _lifespan_manager


# Create the main app with global auth
app = FastAPI(
    title="Hanja API",
    description="API with simple authentication",
    version="1.0.0",
    lifespan=app_lifespan(
        lifespans=[lifespan_main, public.lifespan_public, punctuation.lifespan_punc, ner.lifespan_ner]
    ),
    dependencies=[Depends(verify_api_key)],
)

# Include protected routers
app.include_router(public.router)
app.include_router(punctuation.router)
app.include_router(ner.router)


# Root endpoint (protected)
@app.get("/")
async def root():
    return {"message": "Hanja API is running!"}
