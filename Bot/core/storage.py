import aiomysql
from typing import List, Dict, Optional, AsyncIterator
from contextlib import asynccontextmanager
import uuid

class VintedStorage:
    def __init__(self):
        self.pool: Optional[aiomysql.Pool] = None

    async def connect(self, **kwargs):
        """Établit le pool de connexions"""
        self.pool = await aiomysql.create_pool(
            host=kwargs.get('host', 'localhost'),
            port=kwargs.get('port', 3306),
            user=kwargs.get('user'),
            password=kwargs.get('password'),
            db=kwargs.get('database'),
            minsize=1,
            maxsize=5,
            autocommit=True
        )

    async def close(self):
        """Ferme le pool de connexions"""
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
            self.pool = None

    @asynccontextmanager
    async def get_cursor(self) -> AsyncIterator[aiomysql.Cursor]:
        """Gestionnaire de contexte pour les curseurs"""
        if not self.pool:
            raise RuntimeError("Pool de connexion non initialisé")
        
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                yield cur

    async def is_new(self, item_url: str) -> bool:
        """Vérifie si un item existe déjà"""
        async with self.get_cursor() as cur:
            await cur.execute(
                "SELECT 1 FROM Item WHERE url = %s LIMIT 1",
                (item_url,)
            )
            return await cur.fetchone() is None

    async def batch_save(self, items: List[Dict]):
        """Sauvegarde plusieurs items en une seule opération"""
        if not items:
            return

        values = []
        for item in items:
            photo = item.get('photo', {})
            user = item.get('user', {})
            values.append((
                str(uuid.uuid4()),  # Génère un nouvel UUID
                photo.get('full_size_url') or photo.get('url', ''),
                item.get('title', ''),
                item.get('status', 'inconnu'),
                item.get('size_title', 'inconnu'),
                float(item['price']['amount']),
                user.get('login', 'inconnu'),
                f"https://www.vinted.fr{item['path']}",
                item['search_item_id']
            ))
        
        async with self.get_cursor() as cur:
            await cur.executemany(
                """
                INSERT INTO Item 
                (id, imageUrl, name, `condition`, size, price, sellerName, url, searchItemId, updatedAt)
                VALUES 
                (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """,
                values
            )

    async def get_search_configs(self) -> List[Dict]:
        """Récupère les configurations de recherche"""
        async with self.get_cursor() as cur:
            await cur.execute("""
                SELECT id, searchText as searchText, maxPrice as maxPrice, minPrice as minPrice, tags as tags 
                FROM SearchItem
            """)
            return [
                {
                    "search_text": item['searchText'],
                    "max_price": item['maxPrice'],
                    "min_price": item['minPrice'],
                    "tags": item['tags'].split(',') if item['tags'] else [],
                    "search_item_id": item['id']
                }
                for item in await cur.fetchall()
            ]

    # Gestionnaire de contexte asynchrone
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.close()