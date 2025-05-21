import aiohttp
import asyncio
import logging
import random
import time
from typing import List, Dict, Optional
from .proxy_manager import ProxyManager
from core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VintedScraper:
    def __init__(self, domain: str = "fr"):
        self.base_url = f"https://www.vinted.{domain}"
        self.api_url = f"{self.base_url}/api/v2"
        self.user_agents = [
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
        ]
        self.cookies = {}
        self.semaphore = asyncio.Semaphore(2)
        self.retry_count = 3
        self.proxy_manager = ProxyManager() if settings.USE_PROXIES else None

    async def _create_session(self, proxy: Optional[str] = None) -> aiohttp.ClientSession:
        conn = aiohttp.TCPConnector(ssl=False, limit=10, force_close=True)
        return aiohttp.ClientSession(
            connector=conn,
            cookies=self.cookies,
            headers={
                'User-Agent': random.choice(self.user_agents),
                'Accept': 'application/json',
                'Accept-Language': 'fr-FR,fr;q=0.9',
                'Referer': f'{self.base_url}/',
                'DNT': '1'
            }
        )

    async def _fetch_cookies(self, session: aiohttp.ClientSession, proxy: Optional[str] = None) -> bool:
        """Récupère les cookies initiaux en passant par le proxy si activé"""
        try:
            async with session.get(self.base_url, timeout=10) as response:
                self.cookies = {key: value.value for key, value in response.cookies.items()}
                return True
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des cookies : {str(e)}")
            return False

    async def fetch(self, search_config: Dict) -> List[Dict]:
        params = {
            "page": 1,
            "per_page": 96,
            "search_text": search_config['search_text'],
            "price_to": search_config.get('max_price', 1000),
            "price_from": search_config.get('min_price', 0),
            "order": "newest_first",
            "currency": "EUR",
            "time": int(time.time()),
        }

        for attempt in range(self.retry_count):
            proxy = await self.proxy_manager.get_proxy() if self.proxy_manager else None
            if settings.USE_PROXIES and not proxy:
                logger.error("Aucun proxy disponible alors que USE_PROXIES est activé")
                return []

            session = await self._create_session(proxy)
            try:
                # 1. Cookies init
                if not await self._fetch_cookies(session, proxy):
                    raise RuntimeError("Récupération cookies échouée")

                # 2. APPEL API
                async with self.semaphore:
                    request_params = {
                        "url": f"{self.api_url}/catalog/items",
                        "params": params,
                        "timeout": aiohttp.ClientTimeout(total=15)
                    }
                    if settings.USE_PROXIES and proxy:
                        request_params["proxy"] = proxy

                    async with session.get(**request_params) as response:
                        if response.status == 401:
                            logger.warning("Session expirée - Tentative de renouvellement (HTTP 401)")
                            raise RuntimeError("Session expirée")
                        response.raise_for_status()
                        data = await response.json()
                        items = data.get('items', [])
                        for item in items:
                            item['search_item_id'] = search_config['search_item_id']
                        await session.close()
                        return items

            except Exception as e:
                logger.warning(f"Tentative {attempt+1}/{self.retry_count} échouée avec proxy : {proxy} - {e}")
                await session.close()
                if self.proxy_manager and proxy:
                    self.proxy_manager.remove_proxy(proxy)

        logger.error("Échec après plusieurs tentatives.")
        return []

    # context manager support
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass