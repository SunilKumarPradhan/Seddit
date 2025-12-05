Reddit spoof
docker-compose exec db psql -U meme_user -d meme_forum

ALTER ROLE postgres WITH PASSWORD 'NewStrongAdminPassword';
CREATE ROLE meme_user LOGIN PASSWORD 'meme_pass';



Summary
postgres user → NewStrongAdminPassword
meme_user user → meme_pass




uv run alembic revision --autogenerate -m "after rbac"

uv run alembic upgrade head 

uv run python seed.py


 to run : uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000



npm run build -- --configuration=production


docker-compose exec backend bash
python seed.py





# 1. Stamp to mark current migration as applied
docker-compose exec backend alembic stamp head

# 2. Verify it worked
docker-compose exec backend alembic current

# 3. Seed the roles
docker-compose exec backend python seed.py

# 4. Verify roles were created
docker-compose exec db psql -U meme_user -d meme_forum -c "SELECT id, name FROM roles ORDER BY id;"