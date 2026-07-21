from pydantic import BaseModel


class LogSummary(BaseModel):

    total_logs: int = 0
    error_count: int = 0
    warning_count: int = 0
    exception_count: int = 0
    crashloop_count: int = 0
    oom_count: int = 0
    timeout_count: int = 0
    imagepull_count: int = 0
    top_errors: list[str] = []
    top_exceptions: list[str] = []
    first_error: str | None = None
    last_error: str | None = None
    likely_failure: str | None = None