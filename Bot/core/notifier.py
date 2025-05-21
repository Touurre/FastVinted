import aiohttp
import asyncio
import logging
import random
import time
from typing import List, Dict, Optional
from .proxy_manager import ProxyManager

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


from datetime import datetime
from typing import List, Dict, Optional
import asyncio
from aiohttp import ClientSession
import logging
from .proxy_manager import ProxyManager
from core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DiscordNotifier:
    def __init__(self, webhooks: List[Dict], proxy_manager: Optional[ProxyManager] = None):
        """
        :param webhooks: Liste de dicts avec {'url': 'webhook_url', 'name': 'optional_name'}
        :param proxy_manager: Instance optionnelle de ProxyManager pour utiliser des proxies
        """
        self.webhooks = webhooks
        self.proxy_manager = proxy_manager if settings.USE_PROXIES else None

    async def send_to_all(self, item: dict) -> None:
        """Envoie la notification à tous les webhooks en parallèle"""
        if not self.webhooks:
            logger.warning("Aucun webhook Discord configuré")
            return

        payload = self._prepare_payload(item)
        
        async with ClientSession() as session:
            tasks = [
                self._send_single(
                    session=session,
                    url=wh["url"],
                    payload=payload,
                    webhook_name=wh.get("name", "sans nom")
                )
                for wh in self.webhooks
            ]
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _send_single(
        self,
        session: ClientSession,
        url: str,
        payload: dict,
        webhook_name: str = "sans nom"
    ) -> bool:
        proxy = None
        tried_proxies = set()
        max_attempts = 2

        for attempt in range(1, max_attempts + 1):
            if self.proxy_manager and settings.USE_PROXIES:
                # S'assure d'avoir un proxy différent à chaque tentative
                for _ in range(5):  # évite boucles infinies si peu de proxies
                    proxy_candidate = await self.proxy_manager.get_proxy()
                    if proxy_candidate not in tried_proxies:
                        proxy = proxy_candidate
                        tried_proxies.add(proxy_candidate)
                        break

            try:
                request_params = {
                    "url": url,
                    "json": payload,
                    "timeout": 10
                }
                if settings.USE_PROXIES and proxy:
                    request_params["proxy"] = proxy

                async with session.post(**request_params) as response:
                    response.raise_for_status()
                    logger.info(f"Notification envoyée avec succès à {webhook_name} via {proxy}")
                    return True

            except Exception as e:
                logger.error(f"[Tentative {attempt}] Échec envoi à {webhook_name} (proxy: {proxy}): {str(e)}")
                if attempt == max_attempts:
                    return False  # Après 2 tentatives, abandon
                else:
                    await asyncio.sleep(2)  # Petite pause avant retry (optionnel)

    def _prepare_payload(self, item: dict) -> dict:
        """Prépare le message Discord avec embeds"""
        def format_price(price_data):
            return f"{float(price_data['amount']):.2f} {price_data['currency_code']}"

        def get_photo_url(photo_data):
            return photo_data.get('full_size_url') or photo_data.get('url') if photo_data else None

        def format_seller(user_data):
            if not user_data:
                return "Non disponible"
            return (f"👤 [{user_data['login']}]({user_data['profile_url']})\n"
                    f"⭐ {user_data.get('feedback_reputation', 'N/A')}")

        product_url = f"https://www.vinted.fr{item['path']}"
        price_amount = float(item['price']['amount'])

        embed = {
            "title": f"🏷 {item['title']}",
            "url": product_url,
            "color": 0x00ff00 if price_amount < 20 else (0xff9900 if price_amount < 50 else 0xff0000),
            "timestamp": datetime.utcnow().isoformat(),
            "fields": [
                {
                    "name": "🔍 Détails",
                    "value": (
                        f"• **Marque:** {item.get('brand_title', 'Non spécifié')}\n"
                        f"• **Taille:** {item.get('size_title', '?')}\n"
                        f"• **État:** {item.get('status', '?')}"
                    ),
                    "inline": True
                },
                {
                    "name": "💰 Prix",
                    "value": f"{format_price(item['price'])}",
                    "inline": True
                },
                {
                    "name": "📌 Vendeur",
                    "value": format_seller(item.get('user')),
                    "inline": False
                },
            ],
            "footer": {
                "text": "🛒 Vinted Bot • Notification"
            }
        }

        # Ajout de l'image principale si disponible
        if main_photo := get_photo_url(item.get('photo')):
            embed["image"] = {"url": main_photo}

        return {
            "content": "🛍️ **Nouvelle annonce Vinted !**",
            "embeds": [embed]
        }