from __future__ import annotations

import asyncio

from app.integrations.servicenow.models import InvestigationRequest


class InvestigationQueue:

    def __init__(self):
        self._queue = asyncio.Queue()

    async def submit(
        self,
        request: InvestigationRequest,
    ):
        print(f">>> SUBMIT {request.investigation_id}")
        await self._queue.put(request)

    async def get(self):
        print(f">>> Queue object: {id(self)}")
        request = await self._queue.get()
        print(f">>> GET {request.investigation_id}")
        return request

    def task_done(self):
        self._queue.task_done()


queue = InvestigationQueue()