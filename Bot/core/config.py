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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
        "Referer": "https://www.google.com/",
        "Connection": "keep-alive",
        "Host": "www.vinted.fr",
    }
    
    # Cookies minimum requis
    REQUIRED_COOKIES = [
        "cf_clearance",
        "datadome",
        "OptanonConsent",
        "viewport_size"
    ]
    
    CHECK_INTERVAL: int = 10
    
    # Cookies initiaux (optionnel)
    INITIAL_COOKIES: Dict = {}
    
    # Webhooks Discord
    DISCORD_WEBHOOKS: Dict = {
        "default": os.getenv("DISCORD_WEBHOOK"),
        "urgent": os.getenv("DISCORD_WEBHOOK_URGENT")
    }

settings = Settings()