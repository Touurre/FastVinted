import requests
from datetime import datetime
from typing import List, Dict
import asyncio
from concurrent.futures import ThreadPoolExecutor
from core.config import settings  # Make sure this is the correct import path

class VintedScraper:
    def __init__(self):
        self.session = requests.Session()
        self.base_url = "https://www.vinted.fr/web/api/core/catalog/items"
        self.executor = ThreadPoolExecutor(max_workers=1)
        self._init_session()
    
    def _init_session(self):
        """Initialise la session avec les cookies"""
        self.session.get("https://www.vinted.fr", headers=settings.REQUEST_HEADERS)
        if hasattr(settings, 'INITIAL_COOKIES'):
            self.session.cookies.update(settings.INITIAL_COOKIES)
    
    async def fetch(self, config: Dict) -> List[Dict]:
        """Récupère les items selon la configuration"""
        params = {
            "page": 1,
            "per_page": 30,
            "search_text": config['search_text'],
            "price_to": config['max_price'],
            "price_from": config['min_price'],
            "order": "newest_first",
            "currency": "EUR",
            "time": int(datetime.now().timestamp())
        }
        
        try:
            # Run synchronous requests in a thread
            response = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                lambda: self.session.get(
                    f"{self.base_url}",
                    params=params,
                    headers=settings.REQUEST_HEADERS
                )
            )
            response.raise_for_status()
            return self._filter_items(response.json().get('items', []), config.get('tags', []))
        except Exception as e:
            print(f"Scraping error: {e}")
            return []
    
    def _filter_items(self, items: List[Dict], tags: List[str]) -> List[Dict]:
        """Filtre les items selon les tags"""
        if not tags:
            return items
            
        return [item for item in items if 
                any(tag.lower() in item.get('title', '').lower() for tag in tags)]