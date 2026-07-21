from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.webhook import router as webhook_router
from app.api.investigation import router as investigation_router
from app.api import incidents

from app.queue.manager import queue
from app.queue.worker import InvestigationWorker
from app.api.dashboard import router as dashboard_router
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse



worker = InvestigationWorker(queue)


@asynccontextmanager
async def lifespan(app: FastAPI):
    worker_task = asyncio.create_task(worker.start())

    def log_task_result(task):
        try:
            task.result()
        except Exception:
            import traceback
            traceback.print_exc()

    worker_task.add_done_callback(log_task_result)

    yield

    worker_task.cancel()

    print(f">>> Main queue: {id(queue)}")


app = FastAPI(
    title="ServiceNow Incident Agent",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook_router)
app.include_router(investigation_router)
app.include_router(incidents.router)
app.include_router(dashboard_router)


@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("========== VALIDATION ==========")
    print(exc.errors())
    print("BODY:")
    print(exc.body)

    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )