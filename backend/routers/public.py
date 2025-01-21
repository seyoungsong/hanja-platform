from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import APIRouter, FastAPI
from loguru import logger


@asynccontextmanager
async def lifespan_public(app: FastAPI) -> AsyncIterator[None]:
    logger.debug("Lifespan Public Start")
    yield
    logger.debug("Lifespan Public End")


router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/status")
async def public_status():
    return {"status": "OK", "message": "This is a public endpoint"}


@router.get("/version")
async def public_version():
    return {"version": "1.0.0"}
