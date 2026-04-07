from datetime import datetime
from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy import DateTime

from db.base import Base

class PlatformSettings(Base):
    __tablename__ = "platform_settings"
    
    id = Column(Integer, primary_key=True, default=1)
    site_name = Column(String, default="Mashinarium IT-School")
    site_description = Column(String, nullable=True)
    support_email = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    logo_horizontal_url = Column(String, nullable=True)
    # Email (SMTP)
    smtp_host = Column(String, nullable=True)
    smtp_port = Column(Integer, default=465)
    smtp_user = Column(String, nullable=True)
    smtp_password = Column(String, nullable=True)  # хранить зашифрованным
    smtp_from = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
