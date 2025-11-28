Reddit spoof
ALTER ROLE postgres WITH PASSWORD 'NewStrongAdminPassword';
CREATE ROLE meme_user LOGIN PASSWORD 'meme_pass';



Summary
postgres user → NewStrongAdminPassword
meme_user user → meme_pass




uv run alembic revision --autogenerate -m "initial schema"

uv run alembic upgrade head 

 uv run python seed.py