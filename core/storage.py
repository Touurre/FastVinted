from sqlalchemy import create_engine, Column, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class VintedItem(Base):
    __tablename__ = 'vinted_items'
    id = Column(String(50), primary_key=True)
    data = Column(JSON)  # Stockage de toutes les données
    created_at = Column(DateTime, default=datetime.now)

class VintedStorage:
    def __init__(self):
        self.engine = create_engine('sqlite:///vinted.db')
        self.Session = sessionmaker(bind=self.engine)
        Base.metadata.create_all(self.engine)
    
    async def is_new(self, item_id: str) -> bool:
        with self.Session() as session:
            return session.query(VintedItem).filter_by(id=item_id).first() is None
    
    async def save(self, item_data: dict):
        with self.Session() as session:
            item = VintedItem(
                id=item_data['id'],
                data=item_data
            )
            session.merge(item)
            session.commit()
    
    async def get_recent(self, limit=50):
        with self.Session() as session:
            return session.query(VintedItem).order_by(VintedItem.created_at.desc()).limit(limit).all()