# main.py
import asyncio
from src.scraper import fetch_items
from src.notifier import send_discord_alert, log_item_details
from src.storage import is_new_item, mark_as_processed, init_db
from config import settings

async def monitor_vinted():
    first_run = True
    init_db()
    while True:
        for config in settings.SEARCH_CONFIGS:
            print(f"Vérification de la recherche: {config['search_text']}")
            try:
                items = fetch_items(config)
                for item in items:
                    item_id = item.get("id")
                    if item_id and is_new_item(item_id):
                        if not first_run:
                            send_discord_alert(item, config.get("webhook", "default"))
                        mark_as_processed(item_id)
            except Exception as e:
                print(f"Erreur: {e}")
        first_run = False
        
        await asyncio.sleep(settings.CHECK_INTERVAL)

if __name__ == "__main__":
    asyncio.run(monitor_vinted())