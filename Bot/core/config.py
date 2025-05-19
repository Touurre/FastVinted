import os
from typing import List, Dict
from dotenv import load_dotenv
load_dotenv()

class Settings:
    # Configuration de base
    BASE_URL = "https://www.vinted.fr"
    API_URL = f"{BASE_URL}/api/v2/catalog/items"
    SESSION_DEFAULTS_URL = f"{BASE_URL}/api/v2/configurations/session_defaults"
    
    # Headers de base
    REQUEST_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9",
        "Referer": f"{BASE_URL}/",
        "DNT": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest"
    }
    
    # Cookies minimum requis
    REQUIRED_COOKIES = [
        "cf_clearance",
        "datadome",
        "OptanonConsent",
        "viewport_size"
    ]
    
    # Intervale de vérification (secondes)
    CHECK_INTERVAL: int = 3
    
    # Cookies initiaux (optionnel)
    INITIAL_COOKIES: Dict = {}
    
    # Webhooks Discord
    DISCORD_WEBHOOKS: Dict = {
        "default": os.getenv("DISCORD_WEBHOOK"),
        "urgent": os.getenv("DISCORD_WEBHOOK_URGENT")
    }

settings = Settings()