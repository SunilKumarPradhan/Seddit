"""
Database seeding script for Seddit.
Creates default roles.
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base

# Import ALL models to register them with SQLAlchemy
from app.models.role import Role
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.models.notification import Notification

from app.utils.logger import app_logger


def seed_roles(db: Session):
    """Seed default roles."""
    roles = [
        {"id": 1, "name": "user"},
        {"id": 2, "name": "moderator"},
        {"id": 3, "name": "admin"},
    ]

    print("\n" + "=" * 50)
    print("Creating roles...")
    print("=" * 50)

    for role_data in roles:
        existing = db.query(Role).filter(Role.id == role_data["id"]).first()
        if existing:
            print(f"⚠️  Role already exists: {role_data['name']} (ID: {role_data['id']})")
        else:
            role = Role(**role_data)
            db.add(role)
            print(f"✅ Role created: {role_data['name']} (ID: {role_data['id']})")

    db.commit()
    
    # Verify roles
    all_roles = db.query(Role).order_by(Role.id).all()
    print("\n" + "=" * 50)
    print(f"Total roles in database: {len(all_roles)}")
    for role in all_roles:
        print(f"  - {role.name} (ID: {role.id})")
    print("=" * 50 + "\n")


def run_seed():
    """Main seeding function."""
    print("\n" + "🌱 " * 25)
    print("Starting database seeding...")
    print("🌱 " * 25 + "\n")

    db = SessionLocal()
    try:
        seed_roles(db)
        
        print("\n" + "✅ " * 25)
        print("Database seeding completed successfully!")
        print("✅ " * 25 + "\n")
        
        print("📝 Next steps:")
        print("  1. Go to http://localhost:4200")
        print("  2. Sign up with your first account")
        print("  3. First user will automatically become ADMIN")
        print("  4. Test creating posts and accessing /admin")
        print("\n")
        
    except Exception as e:
        app_logger.error(f"Seeding failed: {e}")
        print(f"\n❌ Error: {e}\n")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()