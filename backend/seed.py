"""
Database seeding script for Seddit.
Creates default roles and optionally sample data.
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
        {
            "id": 1,
            "name": "user",
            "permissions": ["read", "write", "comment", "vote"],
        },
        {
            "id": 2,
            "name": "moderator",
            "permissions": [
                "read",
                "write",
                "comment",
                "vote",
                "delete_post",
                "delete_comment",
                "lock_post",
                "ban_user",
            ],
        },
        {
            "id": 3,
            "name": "admin",
            "permissions": [
                "read",
                "write",
                "comment",
                "vote",
                "delete_post",
                "delete_comment",
                "lock_post",
                "ban_user",
                "manage_roles",
                "manage_users",
                "admin_panel",
            ],
        },
    ]

    for role_data in roles:
        existing = db.query(Role).filter(Role.id == role_data["id"]).first()
        if existing:
            # Update existing role
            existing.name = role_data["name"]
            existing.permissions = role_data["permissions"]
            app_logger.info(f"Updated role: {role_data['name']}")
        else:
            # Create new role
            role = Role(**role_data)
            db.add(role)
            app_logger.info(f"Created role: {role_data['name']}")

    db.commit()
    app_logger.info("Roles seeded successfully!")


def seed_admin_user(db: Session):
    """Seed default admin user if not exists."""
    admin_email = "admin@seddit.com"
    
    existing = db.query(User).filter(User.email == admin_email).first()
    if existing:
        app_logger.info(f"Admin user already exists: {admin_email}")
        return
    
    # Get admin role
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        app_logger.error("Admin role not found! Run seed_roles first.")
        return
    
    admin_user = User(
        username="admin",
        email=admin_email,
        firebase_uid="admin_firebase_uid_placeholder",
        role_id=admin_role.id,
        is_active=True,
        is_banned=False,
    )
    
    db.add(admin_user)
    db.commit()
    app_logger.info(f"Created admin user: {admin_email}")


def run_seed():
    """Main seeding function."""
    print("=" * 50)
    print("Starting database seeding...")
    print("=" * 50)

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_roles(db)
        seed_admin_user(db)
        
        print("=" * 50)
        print("Database seeding completed successfully!")
        print("=" * 50)
    except Exception as e:
        app_logger.error(f"Seeding failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()