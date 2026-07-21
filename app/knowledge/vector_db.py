from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from sentence_transformers import SentenceTransformer

# Shared objects
_client = None
_model = None


class VectorDB:

    def __init__(self):
        global _client
        global _model

        if _client is None:
            _client = QdrantClient(
                path="knowledge/qdrant_data"
            )

        if _model is None:
            _model = SentenceTransformer(
                "all-MiniLM-L6-v2"
            )

        self.client = _client
        self.model = _model
        self.collection = "knowledge"

    def create_collection(self):

        collections = self.client.get_collections()

        names = [
            c.name
            for c in collections.collections
        ]

        if self.collection not in names:

            self.client.create_collection(
                collection_name=self.collection,
                vectors_config=VectorParams(
                    size=384,
                    distance=Distance.COSINE,
                ),
            )

    def embed(
        self,
        text: str,
    ):

        return self.model.encode(
            text
        ).tolist()
    
    def search(
        self,
        query: str,
        limit: int = 3,
    ):

        vector = self.embed(query)

        results = self.client.query_points(
            collection_name=self.collection,
            query=vector,
            limit=limit,
        )

        return results.points