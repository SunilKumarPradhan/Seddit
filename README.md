Reddit spoof
docker-compose exec db psql -U meme_user -d meme_forum

ALTER ROLE postgres WITH PASSWORD 'NewStrongAdminPassword';
CREATE ROLE meme_user LOGIN PASSWORD 'meme_pass';



Summary
postgres user → NewStrongAdminPassword
meme_user user → meme_pass

------------------------------------------


uv run alembic revision --autogenerate -m "after rbac"

uv run alembic upgrade head 

uv run python seed.py


 to run : uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000



npm run build -- --configuration=production


docker-compose exec backend bash
python seed.py

# 0. To Acess the db : 
docker-compose exec db psql -U meme_user -d meme_forum

# Check current users and roles
SELECT u.id, u.username, u.email, r.name as role, r.id as role_id 
FROM users u 
JOIN roles r ON u.role_id = r.id;



# 1. Stamp to mark current migration as applied
docker-compose exec backend alembic stamp head

# 2. Verify it worked
docker-compose exec backend alembic current

# 2.1 Create all tables using Alembic
docker-compose exec backend alembic upgrade head

# 3. Seed the roles
docker-compose exec backend python seed.py

# 4. Verify roles were created
docker-compose exec db psql -U meme_user -d meme_forum -c "SELECT id, name FROM roles ORDER BY id;"




🔧 Step 2: Upgrade to Admin (One Last Time)
bash


docker-compose exec db psql -U meme_user -d meme_forum

# Check new user was created
SELECT id, username, email, role_id FROM users ORDER BY id;

# Make admin@seddit.com an admin (replace ID if different)
UPDATE users SET role_id = 3 WHERE email = 'admin@seddit.com';

# Verify
SELECT u.id, u.username, u.email, r.name as role 
FROM users u 
JOIN roles r ON u.role_id = r.id;

\q







# 1. Reset alembic version
docker-compose exec db psql -U meme_user -d meme_forum -c "DELETE FROM alembic_version;"

# 2. Create a fresh migration
docker-compose exec backend alembic revision --autogenerate -m "initial_tables"

# 3. Apply the migration
docker-compose exec backend alembic upgrade head

# 4. Verify tables
docker-compose exec db psql -U meme_user -d meme_forum -c "\dt"







# to check rows :
docker-compose exec db psql -U meme_user -d meme_forum -c "SELECT * FROM alembic_version;"

# If you see 0 rows :
docker-compose exec backend alembic
 stamp a8007ce4c758

 the hash is of the latest migration











 # Fresh Setup Workflow

## Step 1: Clean Start

# Stop and remove everything (including volumes)
docker-compose down -v

# Optional: Remove images if you want completely fresh build
docker-compose down -v --rmi all

# Build without cache
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Wait 10 seconds for containers to fully start



## Step 2: Clean Start


# Check all containers are up
docker-compose ps

# Watch backend logs
docker-compose logs -f backend

# Press Ctrl+C when you see "Application startup complete"


