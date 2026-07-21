from app.knowledge.vector_db import VectorDB


db = VectorDB()

results = db.search(
    "Market service is unavailable but pods are healthy"
)

for result in results:

    print("=" * 80)
    print("Score:", result.score)
    print("Title:", result.payload["title"])
    print()
    print(result.payload["content"][:200])