from datetime import datetime
from typing import List, Dict, Optional
import asyncio
from aiohttp import ClientSession
import logging
from .proxy_manager import ProxyManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DiscordNotifier:
    def __init__(self, webhooks: List[Dict], proxy_manager: Optional[ProxyManager] = None):
        """
        :param webhooks: Liste de dicts avec {'url': 'webhook_url', 'name': 'optional_name'}
        :param proxy_manager: Instance optionnelle de ProxyManager pour utiliser des proxies
        """
        self.webhooks = webhooks
        self.proxy_manager = proxy_manager

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
            if self.proxy_manager:
                # S'assure d'avoir un proxy différent à chaque tentative
                for _ in range(5):  # évite boucles infinies si peu de proxies
                    proxy_candidate = await self.proxy_manager.get_proxy()
                    if proxy_candidate not in tried_proxies:
                        proxy = proxy_candidate
                        tried_proxies.add(proxy_candidate)
                        break

            try:
                async with session.post(
                    url,
                    json=payload,
                    proxy=proxy,
                    timeout=10
                ) as response:
                    response.raise_for_status()
                    logger.info(f"Notification envoyée avec succès à {webhook_name} via {proxy}")
                    return True

            except Exception as e:
                logger.error(f"[Tentative {attempt}] Échec envoi à {webhook_name} (proxy: {proxy}): {str(e)}")
                if attempt == max_attempts:
                    return False  # Après 2 tentatives, abandon
                else:
                    await asyncio.sleep(1)  # Petite pause avant retry (optionnel)


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