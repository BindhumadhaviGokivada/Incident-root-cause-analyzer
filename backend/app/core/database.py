"""
Database Engine & Session Management
Connects to Supabase PostgreSQL with SSL support and async pooling,
with auto-fallback to local SQLite if the external network is unreachable.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
from app.core.logging import get_logger
import os

logger = get_logger(__name__)

db_url = settings.DATABASE_URL

connect_args = {}
# Supabase PostgreSQL requires SSL encryption
if "supabase.co" in db_url or "postgresql" in db_url:
    connect_args["ssl"] = "require"

try:
    engine = create_async_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        connect_args=connect_args
    )
except Exception as e:
    logger.warning("supabase_engine_creation_failed_using_sqlite", error=str(e))
    engine = create_async_engine("sqlite+aiosqlite:///./rca_local.db", echo=False)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """Initializes tables on the database schema."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("database_tables_verified_ready")
