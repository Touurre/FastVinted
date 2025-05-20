import requests
from datetime import datetime
from typing import List, Dict
import asyncio
from aiohttp import ClientSession


class DiscordNotifier:
    def __init__(self, webhooks: List[Dict]):
        self.webhooks = webhooks

    async def send_to_all(self, item: dict) -> None:
        """Envoie la notification à tous les webhooks en parallèle"""
        if not self.webhooks:
            print("Aucun webhook Discord configuré")
            return

        payload = self._prepare_payload(item)
        
        async with ClientSession() as session:
            tasks = [
                self._send_single(session, wh["url"], payload)
                for wh in self.webhooks
            ]
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _send_single(self, session: ClientSession, url: str, payload: dict) -> bool:
        """Envoie à un webhook spécifique"""
        try:
            async with session.post(url, json=payload, timeout=5) as response:
                response.raise_for_status()
                return True
        except Exception as e:
            print(f"Erreur lors de l'envoi à {url}: {e}")
            return False

    def _prepare_payload(self, item: dict) -> dict:
        """Prépare un message Discord enrichi avec images et infos produit"""
        def format_price(price_data):
            return f"{float(price_data['amount']):.2f} {price_data['currency_code']}"

        def get_photo_url(photo_data):
            return photo_data.get('full_size_url') or photo_data.get('url') if photo_data else None

        def format_seller(user_data):
            return f"👤 [{user_data['login']}]({user_data['profile_url']})" if user_data else "Non disponible"

        product_url = f"https://www.vinted.fr{item['path']}"
        checkout_url = f"https://www.vinted.fr/transaction/buy/new?item_id={item['id']}"
        price_amount = float(item['price']['amount'])

        return {
            "content": "🛍️ **Nouvelle annonce Vinted !**",
            "embeds": [{
                "title": f"🏷 {item['title']}",
                "url": product_url,
                "color": 0x00ff00 if price_amount < 20 else 0xff9900,
                "timestamp": datetime.utcnow().isoformat(),
                "thumbnail": {
                    "url": get_photo_url(item.get('user', {}).get('photo'))
                },
                "image": {
                    "url": get_photo_url(item.get('photo'))
                },
                "fields": [
                    {
                        "name": "🔍 Détails du produit",
                        "value": (
                            f"• **Marque:** {item.get('brand_title', 'Non spécifié')}\n"
                            f"• **Taille:** {item.get('size_title', '?')}\n"
                            f"• **État:** {item.get('status', '?')}"
                        ),
                        "inline": True
                    },
                    {
                        "name": "💰 Prix",
                        "value": (
                            f"• **Article:** {format_price(item['price'])}\n"
                            f"• **Frais protection:** {format_price(item.get('service_fee', {'amount': '0', 'currency_code': 'EUR'}))}\n"
                            f"• **Total:** {format_price(item.get('total_item_price', item['price']))}"
                        ),
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
            }]
        }