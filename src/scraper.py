import requests
import time
from config import settings, secrets

def get_vinted_session():
    """Crée une session avec les cookies valides"""
    session = requests.Session()
    
    # Première requête pour obtenir les cookies initiaux
    home_response = session.get(
        "https://www.vinted.fr",
        headers=settings.REQUEST_HEADERS
    )
    
    # Met à jour avec les cookies manuels si nécessaire
    if secrets.INITIAL_COOKIES:
        session.cookies.update(secrets.INITIAL_COOKIES)
    
    return session

def fetch_items(search_config):
    """Récupère les articles selon la configuration"""
    session = get_vinted_session()
    
    params = {
        "search_text": search_config["search_text"],
        "price_to": search_config["max_price"],
        "price_from": search_config.get("min_price", ""),
        "currency": "EUR",
        "order": "newest_first",
        "per_page": 30,
        "time": int(time.time()),  # Timestamp actuel
    }
    
    # Headers complets
    headers = {
        **settings.REQUEST_HEADERS,
        "Referer": "https://www.vinted.fr/",
        "X-Requested-With": "XMLHttpRequest"
    }
    
    try:
        response = session.get(
            "https://www.vinted.fr/web/api/core/catalog/items",
            params=params,
            headers=headers
        )
        response.raise_for_status()
        
        data = response.json()
        return [item for item in data.get("items", []) 
                if meets_tag_requirements(item, search_config.get("tags", []))]
    
    except requests.exceptions.RequestException as e:
        print(f"Erreur de requête: {e}")
        return []

def meets_tag_requirements(item, required_tags):
    """Vérifie si l'article correspond aux tags requis"""
    if not required_tags:
        return True
        
    title = item.get("title", "").lower()
    description = item.get("description", "").lower()
    text_content = f"{title} {description}"
    
    return all(tag.lower() in text_content for tag in required_tags)