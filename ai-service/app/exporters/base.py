from abc import ABC, abstractmethod
from typing import Any


class BaseExporter(ABC):
    platform_name: str = ""
    platform_version: str = "1.0"
    output_format: str = "json"

    @abstractmethod
    def export_quiz(self, quiz: dict) -> Any:
        """Convert a QuizResponse dict to the platform-specific format."""
        ...

    def get_format_info(self) -> dict:
        return {
            "platform": self.platform_name,
            "version": self.platform_version,
            "format": self.output_format,
        }
