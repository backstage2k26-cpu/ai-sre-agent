from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str
    app_env: str

    servicenow_url: str
    servicenow_username: str
    servicenow_password: str

    grafana_url: str
    grafana_token: str

    loki_datasource_uid: str
    prometheus_datasource_uid: str

    argocd_url: str
    argocd_token: str

    gcp_project: str
    gcp_location: str

    llm_provider: str

    gemini_analysis_model: str
    gemini_report_model: str

    nvidia_api_key: str
    nvidia_model: str

    default_lookback_minutes: int
    request_timeout: int

    DATABASE_URL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def active_model(self) -> str:
        if self.llm_provider.lower() == "gemini":
            return self.gemini_analysis_model

        if self.llm_provider.lower() == "nvidia":
            return self.nvidia_model

        raise ValueError(
            f"Unsupported LLM provider: {self.llm_provider}"
        )


settings = Settings()