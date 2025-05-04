import os
from typing import List, Dict
from dotenv import load_dotenv
load_dotenv()

class Settings:
    # Recherches
    SEARCH_CONFIGS: List[Dict] = [
        {
            "search_text": "nike",
            "max_price": 10,
            "min_price": 1,
            "tags": [],
            "webhook": "default"
        }
    ]
    
    # Intervale de vérification (secondes)
    CHECK_INTERVAL: int = 3
    
    # Headers HTTP
    REQUEST_HEADERS: Dict = {
        "User-Agent": "Mozilla/5.0...",
        "Accept-Language": "fr-FR,fr;q=0.9"
    }
    
    # Cookies initiaux (optionnel)
    INITIAL_COOKIES: Dict = {}
    
    # Webhooks Discord
    DISCORD_WEBHOOKS: Dict = {
        "default": os.getenv("DISCORD_WEBHOOK"),
        "urgent": os.getenv("DISCORD_WEBHOOK_URGENT")
    }

settings = Settings()