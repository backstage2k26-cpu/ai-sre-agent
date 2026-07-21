from pathlib import Path

from qdrant_client.models import PointStruct

from app.knowledge.vector_db import VectorDB


db = VectorDB()

db.create_collection()

folder = Path("data/knowledge")

points = []

for index, file in enumerate(folder.glob("*.md")):

    text = file.read_text()

    vector = db.embed(text)

    points.append(
        PointStruct(
            id=index,
            vector=vector,
            payload={
                "title": file.stem,
                "content": text,
            },
        )
    )

db.client.upsert(
    collection_name=db.collection,
    points=points,
)

print(f"Inserted {len(points)} documents.")