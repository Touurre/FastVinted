# storage.py
from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()
engine = create_engine('sqlite:///vinted.db')
Session = sessionmaker(bind=engine)

class Item(Base):
    __tablename__ = 'items'
    
    id = Column(String, primary_key=True)
    processed_at = Column(DateTime, default=datetime.now)

def init_db():
    Base.metadata.create_all(engine)

def is_new_item(item_id):
    session = Session()
    exists = session.query(Item).filter_by(id=item_id).first() is not None
    session.close()
    return not exists

def mark_as_processed(item_id):
    session = Session()
    if not session.query(Item).filter_by(id=item_id).first():
        session.add(Item(id=item_id))
        session.commit()
    session.close()