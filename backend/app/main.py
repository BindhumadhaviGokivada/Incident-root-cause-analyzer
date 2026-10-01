"""
Root FastAPI application definition with CORS, Lifespan, and Health Checks.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.database import create_tables
from app.api.incidents import router as incident_router
from app.api.observability import router as observability_router
from app.services.elasticsearch_service import elasticsearch_service
from app.services.prometheus_service import prometheus_service

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("startup_rca_backend", version=settings.APP_VERSION)
    # Initialize DB tables (creates SQLite/Postgres tables automatically)
    try:
        await create_tables()
        logger.info("database_tables_initialized")
    except Exception as e:
        logger.warning("database_init_warning", error=str(e))
    yield
    # Cleanup connections
    await elasticsearch_service.close()
    await prometheus_service.close()
    logger.info("shutdown_rca_backend")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise AI Root-Cause Analyzer for Distributed Microservices",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(incident_router, prefix="/api/v1")
app.include_router(observability_router, prefix="/api/v1")


@app.get("/health", tags=["system"])
async def health_check():
    es_status = await elasticsearch_service.health_check()
    prom_status = await prometheus_service.health_check()

    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "services": {
            "elasticsearch": es_status,
            "prometheus": prom_status,
            "database": "connected"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
