from sqlalchemy import Index, func
from sqlalchemy import Column
from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy import DateTime
from sqlalchemy import Table
from sqlalchemy import Text
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID


from db.base import Base

dialog_members = Table(
    "dialog_members",
    Base.metadata,
    Column("user_id", UUID, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True),
    Column("dialog_id", Integer, ForeignKey("dialogs.id", ondelete="CASCADE"), primary_key=True),
    Column("joined_at", DateTime(timezone=True), server_default=func.now()),
)

class Dialog(Base):
    __tablename__ = "dialogs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=True)
    slug = Column(String, nullable=False, unique=True)
    image = Column(String, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    members = relationship("User", secondary="dialog_members", back_populates="dialogs")
    course = relationship("Course", back_populates="dialogs")
    messages = relationship("Message", back_populates="dialog",
                        cascade="all, delete-orphan", lazy="selectin",
                        order_by="Message.created_at")

    __table_args__ = (
            Index('idx_dialog_course_active', 'course_id', 'is_active'),
    )

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    dialog_id = Column(Integer, ForeignKey("dialogs.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(UUID,ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    attachments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    dialog = relationship("Dialog", back_populates="messages")
    sender = relationship("User", back_populates="messages")

    __table_args__ = (
        Index('idx_message_dialog', 'dialog_id'),
    )
