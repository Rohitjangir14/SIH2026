from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseParser(ABC):
    """
    Abstract Base Class for all ULPF Log Parsers.
    New log formats can be plugged in by subclassing BaseParser
    and implementing detect(), parse(), and get_metadata().
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable parser name (e.g. 'Apache Combined Parser')"""
        pass

    @property
    @abstractmethod
    def format_key(self) -> str:
        """Unique identifier key (e.g. 'apache', 'nginx', 'syslog', 'json')"""
        pass

    @abstractmethod
    def detect(self, sample_line: str) -> float:
        """
        Calculates a confidence score (between 0.0 and 1.0)
        indicating whether this parser can handle the provided sample log line.
        """
        pass

    @abstractmethod
    def parse(self, line: str) -> Dict[str, Any]:
        """
        Parses a single log line into raw extracted key-value fields.
        Raises ValueError if line cannot be parsed by this parser.
        """
        pass

    def get_metadata(self) -> Dict[str, Any]:
        """Returns metadata about the parser plugin."""
        return {
            "name": self.name,
            "format_key": self.format_key,
            "description": self.__doc__.strip() if self.__doc__ else "",
            "is_builtin": True,
        }
