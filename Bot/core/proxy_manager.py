import random
import time
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProxyManager:
    def __init__(self):
        self.proxies: List[str] = []
        self.last_refresh = 0
        self.refresh_interval = 3600 * 2  # 4 heures

    async def fetch_proxies(self) -> bool:
        """Récupère les proxies depuis free-proxy-list.net"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("https://free-proxy-list.net/", timeout=20) as resp:
                    html = await resp.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    proxies = []
                    table = soup.find('table', {'class': 'table table-striped table-bordered'})
                    
                    if table:
                        for row in table.find_all('tr')[1:]:  # Skip header
                            cols = row.find_all('td')
                            if len(cols) >= 8:
                                ip = cols[0].text.strip()
                                port = cols[1].text.strip()
                                https = cols[6].text.strip() == 'yes'
                                anonymity = cols[4].text.strip().lower()
                                
                                if https and anonymity in ['elite proxy', 'anonymous']:
                                    proxies.append(f"http://{ip}:{port}")
                    
                    self.proxies = proxies
                    self.last_refresh = time.time()
                    logger.info(f"Récupéré {len(proxies)} proxies valides")
                    return True
        
        except Exception as e:
            logger.error(f"Erreur récupération proxies: {e}")
            return False

    async def get_proxy(self) -> Optional[str]:
        """Retourne un proxy aléatoire, rafraîchit si nécessaire"""
        if not self.proxies or (time.time() - self.last_refresh > self.refresh_interval):
            await self.fetch_proxies()
        
        return random.choice(self.proxies) if self.proxies else None

    async def test_proxy(self, proxy: str, test_url: str = "https://httpbin.org/ip") -> bool:
        """Teste si un proxy fonctionne"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(test_url, proxy=proxy, timeout=10) as resp:
                    return resp.status == 200
        except:
            return False