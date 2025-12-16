from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String 
from sqlalchemy.orm import declarative_base ,relationship
from sqlalchemy.dialects.postgresql import JSONB

Base = declarative_base()

class User(Base):
  __tablename__ = 'user_details'
  fullname = Column(String,nullable=False)
  email = Column(String,nullable=True)
  username = Column(String, nullable=False, unique=True , primary_key=True)
  password = Column(String,nullable=False)
  
class AddQuery(Base):
  __tablename__ = 'add_query'
  id = Column(Integer, primary_key=True)
  user_username = Column(String, ForeignKey("user_details.username"), nullable=False)
  created_at = Column(DateTime,nullable=False)
  question = Column(String,nullable=False)
  concern = Column(String, nullable=True)
  image_url = Column(String,nullable=True)
  answer_summary = Column(String,nullable=True)
  confidence_score = Column(String,nullable=True)

