import aiohttp
import asyncio
from datetime import datetime
from typing import List, Dict
import random

class VintedScraper:
    def __init__(self):
        self.base_url = "https://www.vinted.fr"
        self.session = None
        self.csrf_token = None
        self.cookies = {
            'viewport_size': '571',
            'anonymous-locale': 'fr',
            'domain_selected': 'true'
        }
        self.user_agents = [
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
        ]
        self.semaphore = asyncio.Semaphore(2)  # Limite de requêtes

    async def _init_session(self):
        """Initialise la session avec les cookies nécessaires"""
        self.session = aiohttp.ClientSession(
            cookies=self.cookies,
            headers={
                'User-Agent': random.choice(self.user_agents),
                'Accept-Language': 'fr-FR,fr;q=0.9',
                'DNT': '1',
                'Referer': f'{self.base_url}/'
            }
        )

        # Première requête pour obtenir le token CSRF
        async with self.session.get(
            f"{self.base_url}/api/v2/configurations/session_defaults",
            headers={'Accept': 'application/json'}
        ) as response:
            if response.status == 200:
                # Récupère le cookie de session
                new_cookies = response.cookies
                self.cookies.update({c.key: c.value for c in new_cookies.values()})
                
                # Met à jour la session avec les nouveaux cookies
                self.session = aiohttp.ClientSession(
                    cookies=self.cookies,
                    headers=self.session._default_headers
                )
            else:
                print("Échec de l'initialisation de la session")

    async def fetch(self, search_config: Dict) -> List[Dict]:
        """Effectue la requête principale avec la session initialisée"""
        if not self.session:
            await self._init_session()

        params = {
            "page": 1,
            "per_page": 96,
            "search_text": search_config['search_text'],
            "price_to": search_config.get('max_price', 1000),
            "price_from": search_config.get('min_price', 0),
            "order": "newest_first",
            "currency": "EUR",
            "time": int(datetime.now().timestamp()),
            "catalog_ids": "",
            "size_ids": "",
            "brand_ids": "",
            "status_ids": "",
            "color_ids": "",
            "material_ids": ""
        }

        try:
            async with self.semaphore:
                async with self.session.get(
                    f"{self.base_url}/api/v2/catalog/items",
                    params=params,
                    headers={'Accept': 'application/json'}
                ) as response:
                    
                    if response.status == 401:
                        # Tentative de renouvellement de la session
                        await self._init_session()
                        return await self.fetch(search_config)
                    
                    response.raise_for_status()
                    data = await response.json()
                    
                    items = data.get('items', [])
                    for item in items:
                        item['search_item_id'] = search_config['search_item_id']
                    
                    return items
                    
        except Exception as e:
            print(f"Erreur lors du scraping: {str(e)}")
            return []

    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()