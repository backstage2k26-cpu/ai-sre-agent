from app.schemas.knowledge_match import KnowledgeMatch


class KnowledgeAnalyzer:

    MIN_SIMILARITY = 0.30

    def analyze(self, results):

        if not results:
            return []

        best = max(results, key=lambda r: r.score)

        if best.score < self.MIN_SIMILARITY:
            return []

        results = [best]

        matches = []

        for result in results:

            content = result.payload["content"]

            recommendations = []

            collect = False

            for line in content.splitlines():

                line = line.strip()

                if line.lower().startswith("recommendation"):
                    collect = True
                    continue

                if collect and line:
                    recommendations.append(line)

            matches.append(
                KnowledgeMatch(
                    title=result.payload["title"],
                    similarity=round(result.score, 2),
                    summary=content,
                    recommendation="\n".join(recommendations),
                    source="Knowledge Base",
                )
            )

        return matches