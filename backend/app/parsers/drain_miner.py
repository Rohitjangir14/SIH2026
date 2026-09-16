import re
from typing import List, Dict, Any, Optional


class LogCluster:
    """Represents a cluster of logs sharing a common structural template."""
    def __init__(self, template: List[str], cluster_id: int):
        self.template: List[str] = template
        self.cluster_id: int = cluster_id
        self.size: int = 1
        self.sample_messages: List[str] = []

    def get_template_str(self) -> str:
        return " ".join(self.template)


class DrainMiner:
    """
    Implementation of the Drain tree-based log template mining algorithm.
    Automatically identifies recurring parametric templates with <*> wildcards
    from heterogeneous unstructured log messages.
    """

    def __init__(self, depth: int = 4, sim_threshold: float = 0.5, max_clusters: int = 100):
        self.depth: int = depth
        self.sim_threshold: float = sim_threshold
        self.max_clusters: int = max_clusters
        self.clusters: List[LogCluster] = []
        self._next_cluster_id: int = 1

        # Token replacement regexes for dynamic variable extraction
        self.variable_patterns = [
            (re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\b'), '<IP>'),
            (re.compile(r'\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b'), '<UUID>'),
            (re.compile(r'\b0x[0-9a-fA-F]+\b'), '<HEX>'),
            (re.compile(r'(?<=\s)\d+(?=\s|$)'), '<NUM>'),
            (re.compile(r'/[a-zA-Z0-9_\.\-/]+'), '<PATH>'),
        ]

    def _tokenize(self, message: str) -> List[str]:
        # Pre-process message by replacing variables
        processed = message
        for pattern, replacement in self.variable_patterns:
            processed = pattern.sub(replacement, processed)
        return processed.strip().split()

    def _similarity(self, tokens1: List[str], tokens2: List[str]) -> float:
        if len(tokens1) != len(tokens2):
            return 0.0
        if not tokens1:
            return 1.0
        matches = 0
        for t1, t2 in zip(tokens1, tokens2):
            if t1 == t2 or t1 == "<*>" or t2 == "<*>":
                matches += 1
        return matches / len(tokens1)

    def _merge_template(self, template: List[str], tokens: List[str]) -> List[str]:
        merged = []
        for t1, t2 in zip(template, tokens):
            if t1 == t2:
                merged.append(t1)
            else:
                merged.append("<*>")
        return merged

    def add_log_message(self, message: str) -> LogCluster:
        """Processes a log message into the Drain template cluster."""
        tokens = self._tokenize(message)
        if not tokens:
            tokens = ["<EMPTY>"]

        best_cluster: Optional[LogCluster] = None
        best_sim: float = 0.0

        for cluster in self.clusters:
            if len(cluster.template) == len(tokens):
                sim = self._similarity(cluster.template, tokens)
                if sim > best_sim:
                    best_sim = sim
                    best_cluster = cluster

        if best_cluster and best_sim >= self.sim_threshold:
            best_cluster.template = self._merge_template(best_cluster.template, tokens)
            best_cluster.size += 1
            if len(best_cluster.sample_messages) < 3:
                best_cluster.sample_messages.append(message)
            return best_cluster
        else:
            new_cluster = LogCluster(template=tokens, cluster_id=self._next_cluster_id)
            self._next_cluster_id += 1
            new_cluster.sample_messages.append(message)
            self.clusters.append(new_cluster)
            return new_cluster

    def get_templates(self) -> List[Dict[str, Any]]:
        """Returns sorted list of extracted log templates with occurrence counts."""
        sorted_clusters = sorted(self.clusters, key=lambda c: c.size, reverse=True)
        return [
            {
                "cluster_id": c.cluster_id,
                "template": c.get_template_str(),
                "occurrences": c.size,
                "sample_messages": c.sample_messages,
            }
            for c in sorted_clusters[:self.max_clusters]
        ]


drain_miner = DrainMiner()
