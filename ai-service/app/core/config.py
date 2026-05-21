from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Gemini
    gemini_api_key: str

    # LlamaParse
    llamaparse_api_key: str

    # Database
    database_url: str

    # Server
    port: int = 8001
    debug: bool = True

    # RAG
    chunk_size: int = 512
    chunk_overlap: int = 50
    embedding_model: str = "models/gemini-embedding-2"
    generation_model: str = "models/gemini-2.5-flash"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()