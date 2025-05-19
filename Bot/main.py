import asyncio
import os
from core.storage import VintedStorage
from core.scraper import VintedScraper
from core.notifier import DiscordNotifier
from core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    # Configuration
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME', 'vinted_db')
    }

    # Initialisation avec gestion de contexte
    storage = VintedStorage()
    await storage.connect(**db_config)
    
    try:
        async with VintedScraper() as scraper:
            notifier = DiscordNotifier()
            
            logger.info("Monitoring started...")
            first_run = True
            
            while True:
                try:
                    configs = await storage.get_search_configs()
                    if not configs:
                        configs = settings.SEARCH_CONFIGS
                        logger.warning("Using local configs as fallback")
                    
                    for config in configs:
                        items = await scraper.fetch(config)
                        if items:
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
                    logger.error(f"Main loop error: {str(e)}")
                    await asyncio.sleep(30)  # Longer pause on error
                    
    finally:
        await storage.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Arrêt propre du bot")
    except Exception as e:
        logger.error(f"Erreur critique: {str(e)}")