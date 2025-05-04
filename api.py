from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from core.scraper import VintedScraper
from core.storage import VintedStorage

def create_app():
    app = FastAPI()
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
    )
    
    @app.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket):
        await websocket.accept()
        storage = VintedStorage()
        scraper = VintedScraper()
        
        while True:
            # Recevoir la configuration du front
            config = await websocket.receive_json()
            
            # Exécuter la recherche
            items = await scraper.fetch(config)
            new_items = [item for item in items if await storage.is_new(item['id'])]
            
            # Envoyer les résultats
            await websocket.send_json({
                "status": "success",
                "new_items": new_items
            })
    
    return app