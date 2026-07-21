from app.analyzers.knowledge_analyzer import KnowledgeAnalyzer
from app.clients.knowledge_client import KnowledgeClient

from app.schemas.investigation import InvestigationContext
from app.schemas.knowledge_summary import KnowledgeSummary


class KnowledgeService:

    def __init__(self):

        self.client = KnowledgeClient()

        self.analyzer = KnowledgeAnalyzer()

    async def search(
        self,
        context: InvestigationContext,
    ) -> KnowledgeSummary:

        query = f"""
Service:
{context.service_name}

Application:
{context.application_name}

Problem:
{context.problem_type}

Keywords:
{' '.join(context.keywords)}
"""

        results = await self.client.search(query)

        print("QUERY")
        print(query)

        print("RAW RESULTS")
        for result in results:
            print(result.payload["title"], result.score)

        matches = self.analyzer.analyze(results)

        return KnowledgeSummary(
            found=len(matches) > 0,
            matches=matches,
        )