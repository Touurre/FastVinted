import aiohttp
import asyncio
from datetime import datetime
from typing import List, Dict, Optional
import random
import logging
import time

# Configurez le logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VintedScraper:
    def __init__(self, domain: str = "fr"):
        self.base_url = f"https://www.vinted.{domain}"
        self.api_url = f"{self.base_url}/api/v2"
        self.session: Optional[aiohttp.ClientSession] = None
        self.cookies = {}
        self.user_agents = [
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
        ]
        self.semaphore = asyncio.Semaphore(2)
        self.retry_count = 3

    async def __aenter__(self):
        await self._init_session()
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.close()

    async def _fetch_cookies(self):
        """Récupère les cookies initiaux"""
        try:
            async with aiohttp.ClientSession(headers={'User-Agent': random.choice(self.user_agents)}) as temp_session:
                async with temp_session.get(self.base_url) as response:
                    self.cookies = {key: value for key, value in response.cookies.items()}
                    return True
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des cookies: {str(e)}")
            return False

    async def _init_session(self) -> bool:
        """Initialise la session avec gestion des erreurs"""
        try:
            if not self.cookies:
                success = await self._fetch_cookies()
                if not success:
                    return False

            if self.session and not self.session.closed:
                await self.session.close()

            self.session = aiohttp.ClientSession(
                cookies=self.cookies,
                headers={
                    'User-Agent': random.choice(self.user_agents),
                    'Accept': 'application/json',
                    'Accept-Language': 'fr-FR,fr;q=0.9',
                    'Referer': f'{self.base_url}/',
                    'DNT': '1'
                }
            )

            # Vérification de la session
            async with self.session.get(
                f"{self.api_url}/configurations/session_defaults",
                params={"time": int(time.time())},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    # Met à jour les cookies
                    new_cookies = {c.key: c.value for c in response.cookies.values()}
                    self.cookies.update(new_cookies)
                    return True
                
                logger.error(f"Échec init session - Status: {response.status}")
                return False

        except Exception as e:
            logger.error(f"Erreur initialisation session: {str(e)}")
            return False

    async def fetch(self, search_config: Dict) -> List[Dict]:
        """Effectue la requête avec gestion des réessais"""
        if not self.session or self.session.closed:
            success = await self._init_session()
            if not success:
                return []

        params = {
            "page": 1,
            "per_page": 96,
            "search_text": search_config['search_text'],
            "price_to": search_config.get('max_price', 1000),
            "price_from": search_config.get('min_price', 0),
            "order": "newest_first",
            "currency": "EUR",
            "time": int(time.time()),
            "catalog_ids": "",
            "size_ids": "",
            "brand_ids": "",
            "status_ids": "",
            "color_ids": "",
            "material_ids": ""
        }

        for attempt in range(self.retry_count):
            try:
                async with self.semaphore:
                    async with self.session.get(
                        f"{self.api_url}/catalog/items",
                        params=params,
                        timeout=aiohttp.ClientTimeout(total=15)
                    ) as response:
                        
                        if response.status == 401:
                            logger.warning("Session expirée - Tentative de renouvellement...")
                            await self._fetch_cookies()  # Récupère de nouveaux cookies
                            await self._init_session()    # Réinitialise la session
                            continue
                            
                        response.raise_for_status()
                        data = await response.json()
                        
                        items = data.get('items', [])
                        for item in items:
                            item['search_item_id'] = search_config['search_item_id']
                        
                        return items
                        
            except Exception as e:
                logger.warning(f"Tentative {attempt + 1} échouée: {str(e)}")
                if attempt == self.retry_count - 1:
                    logger.error("Échec après plusieurs tentatives")
                    return []
                await asyncio.sleep(2 * (attempt + 1))  # Backoff exponentiel

        return []

    async def close(self):
        """Ferme proprement la session"""
        if self.session and not self.session.closed:
            await self.session.close()
            self.session = None