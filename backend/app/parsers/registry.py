from typing import Dict, List, Optional
from app.parsers.base import BaseParser
from app.parsers.json_parser import JSONParser
from app.parsers.syslog_parser import SyslogParser
from app.parsers.apache_parser import ApacheParser
from app.parsers.nginx_parser import NginxParser
from app.parsers.csv_parser import CSVParser
from app.parsers.windows_parser import WindowsParser
from app.parsers.regex_parser import RegexParser


class ParserRegistry:
    """
    Registry for all built-in and dynamically registered log parsers.
    """

    def __init__(self):
        self._parsers: Dict[str, BaseParser] = {}
        self._register_builtins()

    def _register_builtins(self):
        builtins = [
            JSONParser(),
            SyslogParser(),
            ApacheParser(),
            NginxParser(),
            CSVParser(),
            WindowsParser(),
            RegexParser(),
        ]
        for p in builtins:
            self.register(p)

    def register(self, parser: BaseParser):
        """Registers a parser instance under its format_key."""
        self._parsers[parser.format_key] = parser

    def get(self, format_key: str) -> Optional[BaseParser]:
        """Retrieves a parser by its format_key."""
        return self._parsers.get(format_key)

    def get_all(self) -> List[BaseParser]:
        """Returns all registered parsers."""
        return list(self._parsers.values())

    def list_metadata(self) -> List[Dict]:
        """Returns metadata list for API exposition."""
        return [p.get_metadata() for p in self._parsers.values()]


# Global registry singleton
parser_registry = ParserRegistry()
