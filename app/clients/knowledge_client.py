from app.knowledge.vector_db import VectorDB


class KnowledgeClient:

    def __init__(self):

        self.db = VectorDB()

    async def search(
        self,
        query: str,
        limit: int = 3,
    ):

        return self.db.search(
            query,
            limit,
        )