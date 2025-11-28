from sqlalchemy import Column, Integer, String, JSON
from app.database import Base


class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # admin, moderator, user
    permissions = Column(JSON, nullable=False, default=list)  # List of permission strings
    
    def __repr__(self):
        return f"<Role {self.name}>"