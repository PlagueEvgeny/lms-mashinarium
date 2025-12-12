from envparse import Env

env = Env()

REAL_DATABASE_URL = env.str(
    "REAL_DATABASE_URL",
    default="postgresql+asyncpg://postgres:postgres@db:5432/postgres",
)  # connect string for the real database

TEST_DATABASE_URL = env.str(
        "TEST_DATABASE_URL",
        default="postgresql+asyncpg://postgres_test:postgres_test@0.0.0.0:5433/postgres_test"
)

APP_PORT: int = env.int("APP_PORT", default=8000)

SECRET_KEY: str = env.str("SECRET_KEY", default="secret_key")
ALGORITHM: str = env.str("ALGORITHM", default="HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = env.int("ACCESS_TOKEN_EXPIRE_MINUTES", default=30)
SENTRY_URL: str = env.str("SENTRY_URL", default="")
