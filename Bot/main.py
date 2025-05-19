import asyncio
import os
from core.storage import VintedStorage
from core.scraper import VintedScraper
from core.notifier import DiscordNotifier
from core.config import settings

async def main():
    # Configuration
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME', 'vinted_db')
    }

    # Initialisation
    storage = VintedStorage()
    await storage.connect(**db_config)
    
    scraper = VintedScraper()
    notifier = DiscordNotifier()
    
    print("Monitoring started...")
    first_run = True
    
    try:
        while True:
            try:
                configs = await storage.get_search_configs()
                if not configs:
                    configs = settings.SEARCH_CONFIGS
                
                for config in configs:
                    items = await scraper.fetch(config)
                    if items:  # Seulement si des items sont retournés
                        new_items = [
                            item for item in items
                            if await storage.is_new(f"https://www.vinted.fr{item['path']}")
                        ]
                        
                        if new_items:
                            await storage.batch_save(new_items)
                            if not first_run:
                                for item in new_items:
                                    await notifier.send(item, config.get('webhook', 'default'))
                
                first_run = False
                await asyncio.sleep(settings.CHECK_INTERVAL)
                
            except Exception as e:
                print(f"Main loop error: {e}")
                await asyncio.sleep(60)  # Attend plus longtemps en cas d'erreur
                
    finally:
        await scraper.close()
        await storage.close()

if __name__ == "__main__":
    asyncio.run(main())