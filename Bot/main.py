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
            logger.info("Monitoring started...")
            
            while True:
                try:
                    configs = await storage.get_search_configs()
                    if not configs:
                        await asyncio.sleep(settings.CHECK_INTERVAL)
                        continue
                    
                    for config in configs:
                        items = await scraper.fetch(config)
                        new_items = [
                            item for item in items 
                            if await storage.is_new(f"https://www.vinted.fr{item['path']}")
                        ]
                        
                        if new_items:
                            await storage.batch_save(new_items)
                            webhooks = await storage.get_discord_webhooks()
                            notifier = DiscordNotifier(webhooks, scraper.proxy_manager)
                            
                            # Envoie les notifications en parallèle
                            tasks = [notifier.send_to_all(item) for item in new_items]
                            await asyncio.gather(*tasks)
                    
                    await asyncio.sleep(settings.CHECK_INTERVAL)
                
                except Exception as e:
                    logger.error(f"Erreur: {str(e)}")
                    await asyncio.sleep(30)
    
    finally:
        await storage.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Arrêt propre du bot")
    except Exception as e:
        logger.error(f"Erreur critique: {str(e)}")