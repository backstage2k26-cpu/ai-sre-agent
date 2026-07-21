from collections import Counter

from app.schemas.logs import LogsInfo
from app.schemas.log_summary import LogSummary


class LogAnalyzer:

    def analyse(
        self,
        logs: LogsInfo,
    ) -> LogSummary:

        summary = LogSummary()

        summary.total_logs = len(logs.entries)
        summary.error_count = logs.error_count
        summary.warning_count = logs.warning_count

        errors = []
        exceptions = []

        for line in logs.entries:

            text = line.lower()

            if "error" in text:
                errors.append(line)

            if "exception" in text:
                summary.exception_count += 1
                exceptions.append(line)

            if "crashloopbackoff" in text:
                summary.crashloop_count += 1

            if "oomkilled" in text:
                summary.oom_count += 1

            if "timeout" in text:
                summary.timeout_count += 1

            if "imagepullbackoff" in text:
                summary.imagepull_count += 1

        if errors:
            summary.first_error = errors[0]
            summary.last_error = errors[-1]
            summary.top_errors = errors[:5]

        if exceptions:
            summary.top_exceptions = exceptions[:5]

        failures = Counter({
            "CrashLoopBackOff": summary.crashloop_count,
            "OOMKilled": summary.oom_count,
            "Timeout": summary.timeout_count,
            "ImagePullBackOff": summary.imagepull_count,
        })

        if failures and failures.most_common(1)[0][1] > 0:
            summary.likely_failure = failures.most_common(1)[0][0]

        return summary