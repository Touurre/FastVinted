import requests
from datetime import datetime
from config import secrets

def get_checkout_url(item):
    """Génère l'URL de checkout direct"""
    return f"https://www.vinted.fr/transaction/buy/new?item_id={item['id']}"

def format_price(price_data):
    """Formate le prix avec la devise et 2 décimales"""
    return f"{float(price_data['amount']):.2f} {price_data['currency_code']}"

def get_main_photo_url(photo_data):
    """Récupère l'URL de la meilleure photo disponible"""
    return photo_data.get('full_size_url') or photo_data.get('url') if photo_data else None

def format_seller_info(user_data):
    """Formate les informations du vendeur avec emoji"""
    return f"👤 [{user_data['login']}]({user_data['profile_url']})" if user_data else "Non disponible"

def prepare_discord_message(item):
    """Prépare le message Discord avec une présentation enrichie"""
    product_url = f"https://www.vinted.fr{item['path']}"
    
    return {
        "content": "🛍️ **Nouvelle annonce Vinted**",
        "embeds": [{
            "title": f"🏷 {item['title']}",
            "url": product_url,
            "color": 0x00ff00 if float(item['price']['amount']) < 20 else 0xff9900,
            "timestamp": datetime.utcnow().isoformat(),
            "thumbnail": {"url": get_main_photo_url(item.get('user', {}).get('photo'))},
            "image": {"url": get_main_photo_url(item.get('photo'))},
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
                    "name": "💰 Détails du prix",
                    "value": (
                        f"• **Prix article:** {format_price(item['price'])}\n"
                        f"• **Frais protection:** {format_price(item.get('service_fee', {'amount': '0', 'currency_code': 'EUR'}))}\n"
                        f"• **Total à payer:** {format_price(item.get('total_item_price', item['price']))}"
                    ),
                    "inline": True
                },
                {
                    "name": "📌 Informations",
                    "value": format_seller_info(item.get('user')),
                    "inline": False
                }
            ],
            "footer": {
                "text": "🛒 Vinted Bot • Notification"
            }
        }]
    }

def send_discord_alert(item, webhook_type="default"):
    """Envoie la notification Discord"""
    webhook_url = secrets.DISCORD_WEBHOOKS.get(webhook_type)
    if not webhook_url:
        print("Erreur: Webhook non configuré")
        return False

    try:
        response = requests.post(
            webhook_url,
            json=prepare_discord_message(item),
            timeout=5
        )
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Erreur lors de l'envoi à Discord: {e}")
        return False

def log_item_details(item):
    print(f"\nNouvel item trouvé (ID: {item['id']}):")
    print(f"- Titre: {item['title']}")
    print(f"- Prix: {format_price(item['price'])}")
    print(f"- Marque: {item.get('brand_title', 'Inconnue')}")
    print(f"- URL Produit: https://www.vinted.fr{item['path']}")