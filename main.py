import asyncio
from fastapi import FastAPI
import uvicorn
from core.scraper import VintedScraper
from core.storage import VintedStorage
from core.notifier import DiscordNotifier
from api import create_app
from core.config import settings

async def run_monitor():
    """Exécute le monitoring en arrière-plan"""
    storage = VintedStorage()
    scraper = VintedScraper()
    notifier = DiscordNotifier()
    print("Monitoring started...")
    first_run = False
    while True:
        for config in settings.SEARCH_CONFIGS:
            try:
                items = await scraper.fetch(config)
                for item in items:
                    if await storage.is_new(item['id']):
                        await storage.save(item)
                        if not first_run:
                            await notifier.send(item, config.get('webhook'))
            except Exception as e:
                print(f"Error: {e}")
        first_run = False
        await asyncio.sleep(settings.CHECK_INTERVAL)
    
async def main():
    app = create_app()
    config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    server = uvicorn.Server(config)

    monitor_task = run_monitor()
    server_task = server.serve()

    await asyncio.gather(monitor_task, server_task)

if __name__ == "__main__":
    asyncio.run(main())