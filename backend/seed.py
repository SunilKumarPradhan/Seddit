from app.database import SessionLocal
from app.models.role import Role
from app.utils.logger import app_logger


def seed_roles(db):
    """Seed initial roles and permissions."""
    
    roles_data = [
        {
            "id": 1,
            "name": "admin",
            "permissions": [
                "post:create", "post:edit:own", "post:edit:any", "post:delete:own", 
                "post:delete:any", "post:lock",
                "comment:create", "comment:edit:own", "comment:edit:any", 
                "comment:delete:own", "comment:delete:any",
                "vote:create", "favorite:manage",
                "user:ban:platform", "user:ban:comment",
                "moderator:manage", "logs:view", "reports:view",
            ]
        },
        {
            "id": 2,
            "name": "moderator",
            "permissions": [
                "post:create", "post:edit:own", "post:delete:own",
                "comment:create", "comment:edit:own", "comment:delete:own", 
                "comment:delete:any",
                "vote:create", "favorite:manage",
                "user:ban:comment", "thread:lock", "reports:view",
            ]
        },
        {
            "id": 3,
            "name": "user",
            "permissions": [
                "post:create", "post:edit:own", "post:delete:own",
                "comment:create", "comment:edit:own", "comment:delete:own",
                "vote:create", "favorite:manage",
            ]
        }
    ]
    
    for role_data in roles_data:
        existing = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing:
            role = Role(**role_data)
            db.add(role)
            app_logger.info(f"Created role: {role_data['name']}")
        else:
            app_logger.info(f"Role already exists: {role_data['name']}")
    
    db.commit()
    app_logger.info("Roles seeded successfully")


def main():
    """Main seed function."""
    db = SessionLocal()
    try:
        app_logger.info("Starting database seeding...")
        seed_roles(db)
        app_logger.info("Database seeded successfully!")
    except Exception as e:
        app_logger.error(f"Seeding failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()