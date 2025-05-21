import random
import time
import aiohttp
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProxyManager:
    """Gestionnaire de proxies venant de proxyscrape (format protocol://ip:port par ligne)."""

    def __init__(self, protocols=('http', 'socks4', 'socks5')):
        self.proxies = []
        self.last_refresh = 0
        self.refresh_interval = 3600 * 2  # 4 heures
        self.protocols = protocols  # filtre sur protocol//ip:port

    async def fetch_proxies(self) -> bool:
        """
        Récupère les proxies depuis ProxyScrape, ne conserve que les protocols spécifiés.
        """
        logger.info("Chargement des proxies depuis ProxyScrape")
        url = "https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=text&timeout=2817"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=20) as resp:
                    text = await resp.text()
                    raw_proxies = text.strip().splitlines()
                    # On filtre en fonction des protocols voulus :
                    filtered = [
                        p for p in raw_proxies
                        if any(p.startswith(proto + '://') for proto in self.protocols)
                    ]
                    self.proxies = filtered
                    self.last_refresh = time.time()
                    logger.info(f"Récupéré {len(filtered)} proxies valides via ProxyScrape")
                    return True
        except Exception as e:
            logger.error(f"Erreur récupération proxies ProxyScrape: {e}")
            return False

    async def get_proxy(self) -> str:
        """Retourne un proxy aléatoire, rafraîchit si nécessaire"""
        if not self.proxies or (time.time() - self.last_refresh > self.refresh_interval):
            await self.fetch_proxies()
        return random.choice(self.proxies) if self.proxies else None

    async def test_proxy(self, proxy: str, test_url: str = "https://httpbin.org/ip") -> bool:
        """Teste si un proxy fonctionne (http/socks compatible avec aiohttp)"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(test_url, proxy=proxy, timeout=10) as resp:
                    return resp.status == 200
        except Exception:
            return False

    def remove_proxy(self, proxy: str):
        """Supprime un proxy inactif"""
        if proxy in self.proxies:
            self.proxies.remove(proxy)
