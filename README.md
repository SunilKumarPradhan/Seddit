Reddit spoof
docker-compose exec db psql -U meme_user -d meme_forum

ALTER ROLE postgres WITH PASSWORD 'NewStrongAdminPassword';
CREATE ROLE meme_user LOGIN PASSWORD 'meme_pass';



Summary
postgres user → NewStrongAdminPassword
meme_user user → meme_pass



docker-compose exec backend alembic revision --autogenerate -m "initial migration"


uv run alembic revision --autogenerate -m "after rbac"

uv run alembic upgrade head 

uv run python seed.py


 to run : uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000



npm run build -- --configuration=production


docker-compose exec backend bash
python seed.py