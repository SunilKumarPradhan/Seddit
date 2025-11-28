uv add fastapi
uv add "uvicorn[standard]"
uv add sqlalchemy
uv add alembic
uv add psycopg2-binary
uv add redis
uv add firebase-admin
uv add python-jose[cryptography]
uv add passlib[bcrypt]
uv add python-multipart
uv add aiofiles
uv add loguru
uv add python-dotenv
uv add pydantic-settings
uv add websockets

# Dev dependencies
uv add --dev pytest
uv add --dev pytest-asyncio
uv add --dev httpx
uv add --dev black
uv add --dev ruff