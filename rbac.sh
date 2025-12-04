#!/bin/bash

# ============================================
# RBAC File Creation Script for MemeForum
# Run this from your project root directory
# ============================================

echo "🚀 Creating RBAC files for MemeForum..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# BACKEND FILES
# ============================================

echo -e "\n${BLUE}📁 Creating Backend Files...${NC}\n"

# Create directories if they don't exist
mkdir -p backend/app/core
mkdir -p backend/app/schemas
mkdir -p backend/app/services
mkdir -p backend/app/api/v1

# 1. Backend Core - Permissions (REPLACE)
echo -e "${GREEN}✓${NC} backend/app/core/permissions.py"
touch backend/app/core/permissions.py

# 2. Backend Schemas - Admin
echo -e "${GREEN}✓${NC} backend/app/schemas/admin.py"
touch backend/app/schemas/admin.py

# 3. Backend Services - Admin Service
echo -e "${GREEN}✓${NC} backend/app/services/admin_service.py"
touch backend/app/services/admin_service.py

# 4. Backend API - Admin Routes
echo -e "${GREEN}✓${NC} backend/app/api/v1/admin.py"
touch backend/app/api/v1/admin.py

# 5. Backend API - __init__.py (UPDATE)
echo -e "${YELLOW}~${NC} backend/app/api/v1/__init__.py (UPDATE EXISTING)"
touch backend/app/api/v1/__init__.py

# 6. Backend Models - User (UPDATE)
echo -e "${YELLOW}~${NC} backend/app/models/user.py (UPDATE EXISTING)"
touch backend/app/models/user.py

# 7. Backend Models - Post (UPDATE)
echo -e "${YELLOW}~${NC} backend/app/models/post.py (UPDATE EXISTING)"
touch backend/app/models/post.py

# 8. Backend - Seed Script (UPDATE)
echo -e "${YELLOW}~${NC} backend/seed.py (UPDATE EXISTING)"
touch backend/seed.py

# 9. Database Migration SQL
echo -e "${GREEN}✓${NC} backend/migrations/rbac_migration.sql"
mkdir -p backend/migrations
touch backend/migrations/rbac_migration.sql

# ============================================
# FRONTEND FILES
# ============================================

echo -e "\n${BLUE}📁 Creating Frontend Files...${NC}\n"

# Create directories if they don't exist
mkdir -p frontend/src/app/core/models
mkdir -p frontend/src/app/core/services
mkdir -p frontend/src/app/core/guards
mkdir -p frontend/src/app/features/admin/admin-dashboard
mkdir -p frontend/src/app/features/admin/admin-users
mkdir -p frontend/src/app/features/admin/admin-posts
mkdir -p frontend/src/app/features/admin/admin-comments

# 10. Frontend Models - Admin Model
echo -e "${GREEN}✓${NC} frontend/src/app/core/models/admin.model.ts"
touch frontend/src/app/core/models/admin.model.ts

# 11. Frontend Services - Permission Service
echo -e "${GREEN}✓${NC} frontend/src/app/core/services/permission.ts"
touch frontend/src/app/core/services/permission.ts

# 12. Frontend Services - Admin Service
echo -e "${GREEN}✓${NC} frontend/src/app/core/services/admin.ts"
touch frontend/src/app/core/services/admin.ts

# 13. Frontend Guards - Admin Guard (REPLACE)
echo -e "${GREEN}✓${NC} frontend/src/app/core/guards/admin-guard.ts"
touch frontend/src/app/core/guards/admin-guard.ts

# 14. Frontend Guards - Role Guard (REPLACE)
echo -e "${GREEN}✓${NC} frontend/src/app/core/guards/role-guard.ts"
touch frontend/src/app/core/guards/role-guard.ts

# 15. Frontend - Admin Dashboard Component
echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-dashboard/admin-dashboard.ts"
touch frontend/src/app/features/admin/admin-dashboard/admin-dashboard.ts

echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-dashboard/admin-dashboard.html"
touch frontend/src/app/features/admin/admin-dashboard/admin-dashboard.html

echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-dashboard/admin-dashboard.css"
touch frontend/src/app/features/admin/admin-dashboard/admin-dashboard.css

# 16. Frontend - Admin Users Component
echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-users/admin-users.ts"
touch frontend/src/app/features/admin/admin-users/admin-users.ts

echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-users/admin-users.html"
touch frontend/src/app/features/admin/admin-users/admin-users.html

echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-users/admin-users.css"
touch frontend/src/app/features/admin/admin-users/admin-users.css

# 17. Frontend - Admin Posts Component
echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-posts/admin-posts.ts"
touch frontend/src/app/features/admin/admin-posts/admin-posts.ts

echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-posts/admin-posts.html"
touch frontend/src/app/features/admin/admin-posts/admin-posts.html

echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-posts/admin-posts.css"
touch frontend/src/app/features/admin/admin-posts/admin-posts.css

# 18. Frontend - Admin Comments Component
echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-comments/admin-comments.ts"
touch frontend/src/app/features/admin/admin-comments/admin-comments.ts

echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-comments/admin-comments.html"
touch frontend/src/app/features/admin/admin-comments/admin-comments.html

echo -e "${GREEN}✓${NC} frontend/src/app/features/admin/admin-comments/admin-comments.css"
touch frontend/src/app/features/admin/admin-comments/admin-comments.css

# 19. Frontend - App Routes (UPDATE)
echo -e "${YELLOW}~${NC} frontend/src/app/app.routes.ts (UPDATE EXISTING)"
touch frontend/src/app/app.routes.ts

# 20. Frontend - User Model (UPDATE)
echo -e "${YELLOW}~${NC} frontend/src/app/core/models/user.model.ts (UPDATE EXISTING)"
touch frontend/src/app/core/models/user.model.ts

# ============================================
# SUMMARY
# ============================================

echo -e "\n=========================================="
echo -e "${GREEN}✅ All files created successfully!${NC}"
echo -e "==========================================\n"

echo -e "${BLUE}📋 FILES CREATED:${NC}\n"

echo "BACKEND (9 files):"
echo "  ├── app/core/permissions.py (REPLACE)"
echo "  ├── app/schemas/admin.py (NEW)"
echo "  ├── app/services/admin_service.py (NEW)"
echo "  ├── app/api/v1/admin.py (NEW)"
echo "  ├── app/api/v1/__init__.py (UPDATE)"
echo "  ├── app/models/user.py (UPDATE)"
echo "  ├── app/models/post.py (UPDATE)"
echo "  ├── seed.py (UPDATE)"
echo "  └── migrations/rbac_migration.sql (NEW)"
echo ""
echo "FRONTEND (18 files):"
echo "  ├── src/app/core/models/admin.model.ts (NEW)"
echo "  ├── src/app/core/models/user.model.ts (UPDATE)"
echo "  ├── src/app/core/services/permission.ts (NEW)"
echo "  ├── src/app/core/services/admin.ts (NEW)"
echo "  ├── src/app/core/guards/admin-guard.ts (REPLACE)"
echo "  ├── src/app/core/guards/role-guard.ts (REPLACE)"
echo "  ├── src/app/app.routes.ts (UPDATE)"
echo "  ├── src/app/features/admin/admin-dashboard/"
echo "  │   ├── admin-dashboard.ts"
echo "  │   ├── admin-dashboard.html"
echo "  │   └── admin-dashboard.css"
echo "  ├── src/app/features/admin/admin-users/"
echo "  │   ├── admin-users.ts"
echo "  │   ├── admin-users.html"
echo "  │   └── admin-users.css"
echo "  ├── src/app/features/admin/admin-posts/"
echo "  │   ├── admin-posts.ts"
echo "  │   ├── admin-posts.html"
echo "  │   └── admin-posts.css"
echo "  └── src/app/features/admin/admin-comments/"
echo "      ├── admin-comments.ts"
echo "      ├── admin-comments.html"
echo "      └── admin-comments.css"

echo -e "\n${YELLOW}⚠️  NEXT STEPS:${NC}"
echo "1. Copy the code from the previous response into each file"
echo "2. Files marked (UPDATE) need to be merged with existing code"
echo "3. Files marked (REPLACE) should replace existing content"
echo "4. Run the SQL migration in backend/migrations/rbac_migration.sql"
echo "5. Run 'python seed.py' in the backend folder to seed roles"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}\n"