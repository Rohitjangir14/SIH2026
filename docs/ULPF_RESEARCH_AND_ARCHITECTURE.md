# ULPF: Universal Log Pre-processing Framework
## Comprehensive Technical Research, Architectural Specification, & Implementation Blueprint

---

### Executive Summary & Problem Domain

In modern distributed computing environments—spanning hybrid clouds (AWS, Azure, GCP), containerized microservices (Kubernetes, Docker), web servers (Apache, Nginx), enterprise operating systems (Linux, Windows Server), databases (PostgreSQL, MongoDB), and custom application workloads—**log data is the primary nervous system for security, compliance, observability, and site reliability engineering (SRE)**.

However, modern IT systems suffer from severe **log format fragmentation**:

```
[Linux Syslog]      Sep 13 10:32:21 srv-prod-01 sshd[2841]: Failed password for invalid user admin from 192.168.1.100 port 44821 ssh2
[AWS CloudWatch]    {"timestamp":"2026-09-13T10:32:21.412Z","status":401,"event":"AUTH_FAILURE","source_ip":"192.168.1.100","principal":"admin"}
[Nginx Access]      192.168.1.100 - admin [13/Sep/2026:10:32:21 +0000] "POST /api/v1/auth/login HTTP/1.1" 401 128 "-" "Mozilla/5.0"
[Windows Event]     <Event xmlns='http://schemas.microsoft.com/win/2004/08/events/event'><System><EventID>4625</EventID><TimeCreated SystemTime='2026-09-13T10:32:21.000Z'/></System><EventData><Data Name='TargetUserName'>admin</Data><Data Name='IpAddress'>192.168.1.100</Data></EventData></Event>
[Spring Boot App]   2026-09-13 10:32:21.014 [http-nio-8080-exec-4] WARN  c.e.s.AuthFilter - Authentication failed for user 'admin' from ip 192.168.1.100
```

All five log lines describe the exact same underlying event: **a failed login attempt for user `admin` from IP `192.168.1.100` at time `2026-09-13 10:32:21`**. Yet:
1. Every source uses a radically different serialization format (Plain text, JSON, Combined Log Format, XML, delimited application log).
2. Field names for identical semantics vary wildly: `principal`, `TargetUserName`, `user`, `user_id`, or implicit positional tokens.
3. Timestamp representations differ across RFC 3164 (no year, local time), ISO 8601 with UTC offset, Common Log Format bracketed dates, and custom millisecond formats.
4. Downstream destinations (SIEM like Splunk/Sentinel, Search engines like OpenSearch/Elasticsearch, and Data Lakes) are burdened with costly ad-hoc parsing rules, custom ingestion filters, and fragile Grok patterns.

**ULPF (Universal Log Pre-processing Framework)** is an open-source, modular, high-throughput ingestion and transformation platform. It acts as an intelligent intermediary between raw heterogeneous log sources and downstream analytics systems, providing **zero-configuration format auto-detection, lossless raw data storage, dynamic plugin-based parsing, deterministic sanitization and PII masking, universal schema normalization, and automated validation**.

---

## 1. Industry Landscape & Competitive Analysis

To establish why ULPF is unique and competitive for enterprise deployment and hackathons such as **Smart India Hackathon (SIH 2026)**, we benchmark existing industry solutions against ULPF:

| Metric / Capability | Vector (Datadog) | Fluent Bit (CNCF) | Logstash (Elastic) | Cribl Stream | ULPF (This Project) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Language** | Rust | C | Java / JRuby | Node.js / C++ | Python (FastAPI / Pydantic Core / AsyncIO) + React |
| **Zero-Config Auto-Detection** | ❌ Manual config / VRL required | ❌ Requires static parser config | ❌ Requires custom Grok pipelines | ⚠️ Partial (Rules-based) | **✅ Native Multi-Stage Probabilistic Auto-Detector** |
| **Schema Normalization** | Manual (VRL code) | Manual (Lua / Filters) | Manual (Logstash filters) | Manual (JavaScript expressions) | **✅ Automated into OCSF/ECS Universal Schema** |
| **PII / Secret Masking** | Regex transforms | Lua script / regex filter | Anonymize filter | Masking expressions | **✅ Out-of-the-box regex + Luhn + Salted Hashing** |
| **Lossless Raw Storage** | User-configured sinks | User-configured | S3/File output | Replay lake integration | **✅ Guaranteed Raw Storage + Replay Pipeline** |
| **Web UI & Visual Explorer** | ❌ CLI only | ❌ CLI / Metrics only | ❌ Kibana required | ✅ Commercial UI | **✅ Full-featured React Studio (Upload, Inspect, Analytics)** |
| **Extensibility Model** | Custom VRL functions | C plugins | Ruby plugins | Custom JS functions | **✅ Python Plugin Registry (Dynamic Hot-Reloading)** |
| **AI / Heuristic Unsupervised Parsing** | ❌ None | ❌ None | ❌ None | ❌ None | **✅ Drain Algorithm Template Extraction + Optional LLM Copilot** |

### Key Differentiation
- **No DSL Barrier**: Vector requires learning VRL (Vector Remap Language), Logstash requires complex Ruby/Grok syntax, and Fluent Bit requires rigid C/Lua configurations. ULPF provides **instant automatic format detection** with clean Python plugin abstractions and an intuitive web UI.
- **Democratic Observability**: Small-to-medium enterprises and hackathon evaluators can run ULPF out of the box with zero boilerplate configuration, inspecting raw versus normalized schemas side-by-side.

---

## 2. Universal Schema Standard: OCSF & ECS Harmonization

A core failure of past log parsers is producing arbitrary, unstructured JSON keys (e.g., one parser creates `{"client_ip": "..."}`, another creates `{"src_ip": "..."}`, a third creates `{"ip": "..."}`).

ULPF adopts a harmonized standard based on the **Open Cybersecurity Schema Framework (OCSF v1.3)** and **Elastic Common Schema (ECS v8.x)**. Every parsed log is mapped into a strict, strongly-typed **Universal Log Schema (ULS)**.

### ULS v1.0 Field Specification

```json
{
  "$schema": "https://ulpf.dev/schemas/v1.0.json",
  "id": "urn:uuid:7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "timestamp": "2026-09-13T10:32:21.000000Z",
  "received_at": "2026-09-13T10:32:22.104250Z",
  
  "source": {
    "type": "linux_syslog",
    "name": "srv-prod-01",
    "ingestion_channel": "file_upload",
    "environment": "production"
  },
  
  "severity": "ERROR",
  "severity_id": 4,
  "event_type": "authentication",
  "action": "logon_failed",
  "status": "failure",
  
  "message": "Failed password for invalid user admin from 192.168.1.100 port 44821 ssh2",
  "cleaned_message": "Failed password for invalid user admin from 192.168.1.100 port 44821 ssh2",
  
  "host": {
    "hostname": "srv-prod-01",
    "ip": "10.0.0.15",
    "os": "Linux"
  },
  
  "user": {
    "name": "admin",
    "domain": null,
    "id": null
  },
  
  "network": {
    "client_ip": "192.168.1.100",
    "client_port": 44821,
    "destination_ip": "10.0.0.15",
    "destination_port": 22,
    "protocol": "tcp",
    "direction": "inbound"
  },
  
  "http": null,
  
  "application": {
    "name": "sshd",
    "version": null,
    "pid": 2841
  },
  
  "enrichment": {
    "geo": {
      "country_code": "US",
      "country_name": "United States",
      "city": "Ashburn",
      "asn": 15169,
      "isp": "Google LLC"
    },
    "threat_intel": {
      "is_known_bogon": false,
      "is_private_ip": true,
      "reputation_score": 0
    }
  },
  
  "security": {
    "sanitized": true,
    "pii_masked": false,
    "masked_fields": []
  },
  
  "metadata": {
    "raw_log_id": "urn:uuid:1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
    "parser_used": "SyslogParser",
    "parser_version": "1.2.0",
    "detection_confidence": 0.98,
    "processing_latency_ms": 1.45
  }
}
```

### Universal Normalization Tables

#### 1. Severity Level Mapping (RFC 5424 / Syslog to ULS)
| Canonical ULS Severity | Severity ID | Syslog Code | RFC 5424 Equivalent | Alternate Text Representations (Auto-Mapped) |
| :--- | :--- | :--- | :--- | :--- |
| **`CRITICAL`** | 6 | 0, 1, 2 | Emergency, Alert, Critical | `EMERG`, `ALERT`, `CRIT`, `FATAL`, `SEVERE`, `PANIC` |
| **`ERROR`** | 4 | 3 | Error | `ERR`, `ERRO`, `FAIL`, `FAILURE`, `EXCEPTION`, `STDERR` |
| **`WARNING`** | 3 | 4 | Warning | `WARN`, `WARNING`, `WRN`, `CAUTION` |
| **`INFO`** | 2 | 5, 6 | Notice, Informational | `INF`, `INFO`, `INFORMATION`, `NOTICE`, `STDOUT` |
| **`DEBUG`** | 1 | 7 | Debug | `DBG`, `DEBUG`, `TRACE`, `VERBOSE`, `FINE`, `FINER` |
| **`UNKNOWN`** | 0 | - | - | Unrecognized severity string or missing field |

#### 2. Event Category Taxonomy
- `authentication`: Logins, logouts, token validations, MFA challenges.
- `network`: Connection accepted, packet drops, DNS lookups, TLS handshakes.
- `web_traffic`: HTTP/HTTPS requests, API queries, proxy transactions.
- `system`: OS kernel messages, process creation, service start/stop, memory faults.
- `database`: SQL queries, connection pool exhaustion, transaction rollbacks.
- `application`: General application business logic errors and execution logs.
- `audit`: IAM permission alterations, configuration modifications, policy changes.

---

## 3. Algorithmic Foundation: Automatic Format Detection

A signature feature of ULPF is **Zero-Configuration Automatic Format Detection**. Rather than requiring human operators to specify whether a file is Nginx, Syslog, or JSON, ULPF uses a **Multi-Stage Probabilistic Format Classification Engine (MPFCE)**.

### Detection Pipeline Architecture

```
Raw Sample Buffer (First 50 lines / 64 KB)
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Stage 1: Fast Structural Token Check            │
│ - JSON validation check (simd-json / orjson)    │
│ - XML root tag match (<.*?>)                   │
│ - Delimiter frequency entropy (CSV, TSV, Pipe)  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Stage 2: Regular Expression Anchor Signatures   │
│ - RFC 3164 Syslog: ^[A-Z][a-z]{2}\s+\d{1,2}... │
│ - RFC 5424 Syslog: ^<\d{1,3}>\d\s+\d{4}-...    │
│ - Nginx/Apache Combined: ^(\S+) \S+ \S+ \[...   │
│ - Windows Event XML: <Event xmlns=...           │
│ - Standard ISO-8601 Timestamp prefixes          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Stage 3: Multi-Line Confidence Scoring          │
│ Evaluate sample across N lines:                 │
│ Confidence S_j = sum(W_k * match_k) / N         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Stage 4: Decision & Plugin Dispatch             │
│ - If max(S_j) >= 0.70 -> Dispatch to Parser_j   │
│ - If max(S_j) < 0.70  -> Fallback: Drain/Regex  │
└─────────────────────────────────────────────────┘
```

### Mathematical Confidence Formulation
For each candidate parser plugin $P_j$, the confidence score $C(P_j)$ across a sample of $M$ lines $\{L_1, L_2, \dots, L_M\}$ is calculated as:

$$C(P_j) = \frac{1}{M} \sum_{i=1}^{M} \left( \alpha \cdot \text{RegexMatch}(P_j, L_i) + \beta \cdot \text{SchemaMatch}(P_j, L_i) + \gamma \cdot \text{EntropyWeight}(L_i) \right) - \delta \cdot \text{FailurePenalty}$$

Where:
- $\alpha = 0.50$: Structural pattern match (exact regular expression / grammar parser).
- $\beta = 0.35$: Semantic extraction check (presence of valid date, recognized severity, or valid IP).
- $\gamma = 0.15$: Line consistency across multiple lines in the sample batch.
- $\delta = 0.40$: Penalty applied if lines fail catastrophically (e.g. malformed JSON tokens).

A candidate plugin is selected when $C(P_j) \ge \tau = 0.75$. If multiple candidates exceed $\tau$, the parser with the highest score is chosen. If no candidate reaches $\tau$, the engine flags the format as `CUSTOM_OR_UNKNOWN` and triggers the unsupervised template induction engine (Drain algorithm).

---

## 4. The Plugin Engine Architecture

To adhere to the Open-Closed Principle (SOLID), the core engine never hardcodes parser logic. Instead, every parser is an encapsulated subclass of `BaseParser`.

```
                  ┌──────────────────────┐
                  │      BaseParser      │
                  │   (Abstract Class)   │
                  └──────────┬───────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
┌──────▼──────┐       ┌──────▼──────┐       ┌──────▼──────┐
│  JSONParser │       │ SyslogParser│       │ ApacheParser│
└─────────────┘       └─────────────┘       └─────────────┘
       │                     │                     │
┌──────▼──────┐       ┌──────▼──────┐       ┌──────▼──────┐
│ NginxParser │       │ WinEvtParser│       │ CustomParser│
└─────────────┘       └─────────────┘       └─────────────┘
```

### Parser Interface Contract
```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class DetectionResult(BaseModel):
    format_name: str
    confidence: float
    matched_patterns: List[str]
    sample_parsed_fields: Dict[str, Any]

class RawRecord(BaseModel):
    raw_content: str
    line_number: int
    offset: int

class ParsedRecord(BaseModel):
    timestamp: str
    severity: str
    message: str
    event_type: Optional[str] = None
    host: Optional[str] = None
    user: Optional[str] = None
    ip_address: Optional[str] = None
    application: Optional[str] = None
    attributes: Dict[str, Any] = {}

class BaseParser(ABC):
    """Abstract Base Class for all ULPF Parser Plugins."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique parser identifier."""
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        """Semantic version of the plugin."""
        pass

    @abstractmethod
    def detect(self, sample_lines: List[str]) -> DetectionResult:
        """Inspect sample lines and return a confidence score between 0.0 and 1.0."""
        pass

    @abstractmethod
    def parse_line(self, raw_line: str) -> Optional[ParsedRecord]:
        """Parse a single raw log line into a standardized ParsedRecord."""
        pass

    def parse_batch(self, batch: List[str]) -> List[Optional[ParsedRecord]]:
        """Batch processing implementation, default fallback to line-by-line."""
        return [self.parse_line(line) for line in batch]
```

### Parser Implementations Provided

#### 1. JSON Parser
- **Engine**: `orjson` (Rust-based Python serializer/deserializer, up to 10x faster than standard Python `json`).
- **Dynamic Field Aliasing**: Checks candidate timestamp fields (`timestamp`, `time`, `@timestamp`, `event_time`, `created_at`, `datetime`), candidate severity fields (`severity`, `level`, `log_level`, `status`), and candidate message fields (`message`, `msg`, `error`, `text`, `description`).
- **Unmapped Keys**: Automatically packed into `metadata` / `attributes` JSONB without data loss.

#### 2. RFC 3164 / RFC 5424 Syslog Parser
- **RFC 3164 (BSD Syslog)**:
  `^<(?P<priority>\d+)>?(?P<timestamp>[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(?P<host>\S+)\s+(?P<app>[^:\[\s]+)(?:\[(?P<pid>\d+)\])?:\s+(?P<message>.*)$`
- **RFC 5424 (IETF Syslog)**:
  `^<(?P<priority>\d{1,3})>(?P<version>\d+)\s+(?P<timestamp>\S+)\s+(?P<host>\S+)\s+(?P<app>\S+)\s+(?P<procid>\S+)\s+(?P<msgid>\S+)\s+(?P<structured_data>\[.*?\]|-)\s+(?P<message>.*)$`
- **Facility & Severity Decoding**: Converts priority integer using $\text{Facility} = \text{priority} \gg 3$ and $\text{Severity} = \text{priority} \ \& \ 7$.

#### 3. Apache & Nginx Access Log Parsers
- **Common Log Format (CLF)**:
  `^(?P<ip>\S+)\s+\S+\s+(?P<user>\S+)\s+\[(?P<timestamp>[^\]]+)\]\s+"(?P<method>[A-Z]+)\s+(?P<path>\S+)\s+(?P<protocol>[^"]+)"\s+(?P<status>\d{3})\s+(?P<bytes>\S+)`
- **Combined Log Format (with Referer & User-Agent)**:
  `^(?P<ip>\S+)\s+\S+\s+(?P<user>\S+)\s+\[(?P<timestamp>[^\]]+)\]\s+"(?P<method>[A-Z]+)\s+(?P<path>\S+)\s+(?P<protocol>[^"]+)"\s+(?P<status>\d{3})\s+(?P<bytes>\S+)\s+"(?P<referer>[^"]*)"\s+"(?P<user_agent>[^"]*)"`
- **Status Code Mapping**:
  - `1xx`, `2xx`, `3xx` $\to$ `INFO`
  - `4xx` $\to$ `WARNING` (`401/403` flagged as `authentication`)
  - `5xx` $\to$ `ERROR`

#### 4. Windows Event Log Parser
- Parses Windows Event XML exports and Sysmon telemetry.
- Extracts `EventID` (e.g., `4624` = Successful Logon, `4625` = Failed Logon, `4688` = Process Created).
- Extracts `TimeCreated`, `Execution ProcessID`, `Computer`, `TargetUserName`, and `IpAddress`.

#### 5. Delimited Text Parser (CSV / TSV)
- Uses Python `csv.Sniffer()` to determine delimiter (comma, tab, semicolon, pipe).
- Performs fuzzy header matching to detect standard columns.

---

## 5. Data Cleaning, PII Masking, & Sanitization

Data in the real world is messy, corrupted, and fraught with compliance vulnerabilities (GDPR, HIPAA, DPDP Act 2023). ULPF embeds a dedicated cleaning and sanitization pipeline before normalization.

### 1. Cleaning Operations
- **Whitespace Normalization**: Removes trailing/leading whitespace, converts non-breaking spaces `\u00A0` to standard spaces, condenses repeated horizontal tabs.
- **Escape Sequence Unescaping**: Converts `\"`, `\n`, `\t`, `\\` correctly while guarding against malformed unicode surrogates.
- **Timestamp Harmonization**: Employs `python-dateutil` and custom fast-path ISO formatters to convert 18+ datetime string permutations (e.g. `13/Sep/2026:10:32:21 +0000`, `Sep 13 10:32:21`, `2026-09-13 10:32:21,412`, Epoch timestamp in seconds or milliseconds) into canonical UTC ISO-8601 string: `YYYY-MM-DDTHH:MM:SS.ffffffZ`.
- **IP Address Sanitization**: Verifies validity using Python `ipaddress` module; tags loopback (`127.0.0.1`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and bogons.

### 2. PII & Secret Redaction Engine
Logs often leak high-risk confidential data. ULPF incorporates a **Deterministic High-Speed Redaction Engine**:

```
Raw Message:
"User ronak authenticated with password=SuperSecretPassword123! token=eyJhbGciOiJIUzI1Ni... card=4532-8921-9832-1092"
                                   │
                                   ▼
[PII Masking Engine]
- Password regex pattern detection
- JWT token pattern detection
- Credit card regex + Luhn algorithm validation
- Email & phone regex
                                   │
                                   ▼
Cleaned Message:
"User ronak authenticated with password=[REDACTED] token=[JWT_REDACTED] card=4532-XXXX-XXXX-1092"
```

#### Supported Redaction Rules
1. **Passwords & Secrets**: Matches `password=...`, `passwd=...`, `secret=...`, `pwd=...`, `apiKey=...`.
2. **Bearer / JWT Tokens**: Matches `Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+`.
3. **AWS Access Keys**: Matches `(AKIA[0-9A-Z]{16})`.
4. **Credit Cards**: Matches Visa, MasterCard, Amex, RuPay with **Luhn check verification** (ensures arbitrary 16-digit numbers like order IDs are not mistakenly masked).
5. **Aadhaar & SSN**: Matches Indian 12-digit Aadhaar `\b\d{4}\s\d{4}\s\d{4}\b` and US SSN `\b\d{3}-\d{2}-\d{4}\b`.
6. **Masking Modes**:
   - `REPLACE`: Completely replace with token (e.g., `[REDACTED]`).
   - `PARTIAL_MASK`: Preserve first 4 and last 4 characters (`4532-****-****-1092`).
   - `HMAC_HASH`: Replace with salted hash `SHA256(salt + value)` so analysts can track identical users/IPs across logs without discovering the true plaintext.

---

## 6. Validation Engine & Dead-Letter Queue (DLQ)

A failure in parsing should **never crash the system** or silently drop records.

### Pydantic v2 Contract Validation
Every normalized record is validated against `UniversalLogRecord`:
- `id`: Valid UUIDv4 string.
- `timestamp`: Strict ISO-8601 datetime in UTC.
- `severity`: Must belong to Enum `[CRITICAL, ERROR, WARNING, INFO, DEBUG, UNKNOWN]`.
- `message`: Non-empty string.
- `source.name` and `source.type`: Non-empty strings.

### DLQ (Dead-Letter Queue) Isolation Strategy
If a log fails parsing or validation:
1. The original raw log is flagged with status `FAILED_VALIDATION` or `UNPARSED`.
2. A record is inserted into the `validation_errors` table containing:
   - `raw_log_id`
   - `error_code` (e.g., `ERR_INVALID_TIMESTAMP`, `ERR_UNKNOWN_FORMAT`, `ERR_MISSING_MANDATORY_FIELD`)
   - `error_message` & `stack_trace`
   - `unparsed_tokens`
3. The batch job continues processing remaining lines without interruption.
4. Administrators can inspect the DLQ in the web interface, tweak the parser or create a new regex rule, and trigger **One-Click Replay**.

---

## 7. Storage Architecture & Relational Schema

ULPF separates **Raw Ingestion Storage** from **Normalized Processed Storage**. This guarantees complete auditability, legal compliance, and reprocessing resilience.

```
                  ┌──────────────────────┐
                  │    Log Ingestion     │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   ┌─────────────────┐               ┌─────────────────┐
   │    raw_logs     │ (Immutable)   │  processed_logs │ (Universal Schema)
   │  - id           │               │  - id           │
   │  - raw_content  │               │  - timestamp    │
   │  - received_at  │               │  - severity     │
   │  - status       │               │  - message      │
   └────────┬────────┘               │  - host, user   │
            │                        │  - ip_address   │
            │ (On Failure)           │  - metadata     │
            ▼                        └─────────────────┘
   ┌─────────────────┐
   │validation_errors│
   │  - raw_log_id   │
   │  - error_code   │
   │  - error_trace  │
   └─────────────────┘
```

### Complete PostgreSQL Schema (DDL)

```sql
-- Enable UUID extension and Trigam extension for fast full-text search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Users and RBAC
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Log Sources
CREATE TABLE log_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('file', 'api', 'syslog', 'kafka', 's3')),
    detected_format VARCHAR(100) DEFAULT 'auto',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Processing Jobs
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES log_sources(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED')),
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    success_rate NUMERIC(5,2) DEFAULT 0.00,
    detected_format VARCHAR(100),
    parser_used VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Raw Logs (Lossless Immutable Ingestion Store)
CREATE TABLE raw_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    source_id UUID REFERENCES log_sources(id) ON DELETE SET NULL,
    raw_content TEXT NOT NULL,
    line_number INTEGER,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (processing_status IN ('PENDING', 'PROCESSED', 'FAILED', 'REPROCESSED'))
);

-- 5. Processed Logs (Normalized Universal Schema)
CREATE TABLE processed_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_log_id UUID REFERENCES raw_logs(id) ON DELETE CASCADE,
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'UNKNOWN')),
    severity_id SMALLINT NOT NULL DEFAULT 0,
    event_type VARCHAR(100),
    action VARCHAR(100),
    status VARCHAR(50),
    message TEXT NOT NULL,
    host VARCHAR(255),
    user_name VARCHAR(255),
    ip_address INET,
    client_port INTEGER,
    application VARCHAR(255),
    environment VARCHAR(50) DEFAULT 'production',
    metadata JSONB DEFAULT '{}'::jsonb,
    enrichment JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Dead-Letter Queue (Validation and Parse Errors)
CREATE TABLE validation_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_log_id UUID REFERENCES raw_logs(id) ON DELETE CASCADE,
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    error_code VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    raw_snippet TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Parser Plugins Registry
CREATE TABLE parser_plugins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    version VARCHAR(20) NOT NULL,
    format_type VARCHAR(50) NOT NULL,
    is_builtin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    regex_pattern TEXT,
    field_mapping JSONB DEFAULT '{}'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized Performance Indexes
CREATE INDEX idx_processed_logs_timestamp ON processed_logs (timestamp DESC);
CREATE INDEX idx_processed_logs_severity ON processed_logs (severity);
CREATE INDEX idx_processed_logs_job_id ON processed_logs (job_id);
CREATE INDEX idx_processed_logs_ip ON processed_logs (ip_address);
CREATE INDEX idx_processed_logs_app ON processed_logs (application);
CREATE INDEX idx_processed_logs_metadata_gin ON processed_logs USING GIN (metadata);
CREATE INDEX idx_processed_logs_message_trgm ON processed_logs USING GIN (message gin_trgm_ops);
CREATE INDEX idx_raw_logs_job_status ON raw_logs (job_id, processing_status);
```

---

## 8. AI & Machine Learning: Pragmatic Innovations

A critical directive for competitive hackathons like SIH is: **Do NOT build a generic chatbot wrapper.** Real-world data engineering requires high performance, predictability, and determinism.

ULPF integrates AI selectively in three specific high-value areas:

### 1. Unsupervised Log Template Mining: The Drain Algorithm
When dealing with novel or custom enterprise application logs that have no existing parser, ULPF employs **Drain** (an online log parsing algorithm developed by LogPAI).

```
Incoming Unstructured Log
            │
            ▼
┌─────────────────────────┐
│ Tokenizer               │  Tokens: ["Failed", "password", "for", "root", "from", "1.2.3.4"]
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Fixed-Depth Parse Tree  │  Depth 1: Length = 6 tokens
│ (Depth D = 4)           │  Depth 2: First Token = "Failed"
└───────────┬─────────────┘  Depth 3: Internal Node -> Search Leaf Nodes
            ▼
┌─────────────────────────┐
│ Similarity Comparison   │  Template: "Failed password for <*>" from "<*>"
│ Cosine / Jaccard Token  │  Variables: user="root", ip="1.2.3.4"
└─────────────────────────┘
```

- **Algorithm Mechanics**:
  - Drain maintains a parse tree of fixed depth $D=4$.
  - Layer 1 categorizes logs by token length.
  - Layer 2 and 3 route by token positions containing non-numeric constant keywords.
  - Layer 4 (leaf nodes) groups similar log events, converting variable parameters (IPs, numbers, user IDs) into wildcards `<*>`.
- **Why Drain over LLMs**:
  - **Latency**: $0.05\text{ ms}$ per log line versus $800\text{ ms}$ for an LLM API call.
  - **Cost**: Zero API tokens consumed.
  - **Throughput**: Processes $>30,000\text{ logs/sec}$ locally on a single CPU core.

### 2. LLM-Assisted Dynamic Parser Generator (Admin Copilot)
When a user uploads a completely unknown log format and wants to generate a permanent parser plugin:
1. ULPF extracts 5 representative lines from the Drain template cluster.
2. The user clicks **"Generate Parser with AI"**.
3. A focused prompt is sent to a local or cloud LLM (e.g. Gemini 1.5 Flash / Llama-3-8B):
   ```
   Given these sample log lines:
   [SAMPLE 1]: 2026-09-13 14:22:01.102 [worker-3] DB_TIMEOUT conn_id=981 host=db-primary.internal
   [SAMPLE 2]: 2026-09-13 14:22:04.551 [worker-1] DB_TIMEOUT conn_id=984 host=db-replica.internal
   
   Generate a Python regex with named capture groups (?P<field_name>...) matching:
   timestamp, severity (infer), thread, event_type, host, metadata.
   Output ONLY valid JSON containing 'regex' and 'field_mappings'.
   ```
4. The generated regex is validated against test samples in an in-memory sandbox.
5. The administrator reviews the detected fields, clicks **"Accept & Register Plugin"**, and the new parser is saved into the database and immediately available without restarting the server.

### 3. Real-Time Anomaly & Burst Detection
- Calculates a dynamic baseline of error rates using an exponential moving average (EMA):
  $$\text{EMA}_t = \lambda \cdot \text{ErrorCount}_t + (1 - \lambda) \cdot \text{EMA}_{t-1}$$
- If $\text{ErrorCount}_t > \text{EMA}_t + 3\sigma$, an automatic **Anomaly Alert** is triggered on the dashboard.

---

## 9. Scalability: From Local MVP to Enterprise Architecture

ULPF is architected with a phased scaling path, making it ideal for both hackathon demonstrations and high-scale enterprise deployment.

### Phase 1: Local / Hackathon MVP Architecture
```
┌────────────────────────────────────────────────────────┐
│                   React 18 + Vite                      │
│            Tailwind CSS + Recharts UI                  │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs / SSE Stream
┌───────────────────────────▼────────────────────────────┐
│                    FastAPI Backend                     │
│  - REST Ingestion Endpoints (/upload, /process)        │
│  - Format Detection Engine                             │
│  - Plugin Parser Registry                              │
│  - Normalizer & Redaction Engine                       │
│  - AsyncIO Background Worker Pool                      │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy Async Session
┌───────────────────────────▼────────────────────────────┐
│                 PostgreSQL 16 Database                 │
│  - raw_logs | processed_logs | processing_jobs         │
└────────────────────────────────────────────────────────┘
```

### Phase 2: Enterprise Distributed Architecture (1M+ Logs/Minute)
```
                    ┌────────────────────────────┐
                    │ Log Shippers (Fluent Bit)  │
                    │ IoT / Apps / CloudWatch    │
                    └─────────────┬──────────────┘
                                  │ HTTP / Syslog UDP/TCP
                    ┌─────────────▼──────────────┐
                    │      Traefik / Nginx       │
                    │       Load Balancer        │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │  FastAPI Gateway Ingestion │
                    └─────────────┬──────────────┘
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │   Apache Kafka / Redpanda  │
                    │  Topic: "ulpf.logs.raw"    │
                    └─────────────┬──────────────┘
                                  │ Consumer Groups
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Processing Node 1│    │ Processing Node 2│    │ Processing Node 3│
│ - Format Detect  │    │ - Format Detect  │    │ - Format Detect  │
│ - Plugin Parser  │    │ - Plugin Parser  │    │ - Plugin Parser  │
│ - PII Redact     │    │ - PII Redact     │    │ - PII Redact     │
│ - Normalize      │    │ - Normalize      │    │ - Normalize      │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         └────────────────────────┼────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│    PostgreSQL    │    │    OpenSearch    │    │  MinIO / S3 Lake │
│ (Transactional & │    │  (Instant SIEM   │    │ (Parquet Files / │
│   Management)    │    │ Full-Text Search)│    │ Cold Storage)    │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 10. Complete REST API Specification

| Endpoint | Method | Description | Request Payload | Response |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | `POST` | Authenticate user & get JWT | `{email, password}` | `{access_token, token_type, user}` |
| `/api/v1/logs/upload` | `POST` | Upload log file (multipart) | `file: UploadFile, source_name: str` | `{job_id, status, file_name, total_lines}` |
| `/api/v1/logs/detect` | `POST` | Quick format check on sample text | `{sample_text: str}` | `{detected_format, confidence, preview}` |
| `/api/v1/logs/process/{job_id}` | `POST` | Trigger parsing & normalization job | `{parser_override?: str}` | `{job_id, status, started_at}` |
| `/api/v1/logs` | `GET` | Query normalized logs with pagination | Query params: `page, limit, severity, ip...`| `{items: [...], total, page, pages}` |
| `/api/v1/logs/{id}` | `GET` | Get single log with raw vs normalized diff | None | `{processed: {...}, raw: {...}}` |
| `/api/v1/logs/search` | `GET` | Full-text and regex search | `?q=login+failed&severity=ERROR` | `{items: [...], execution_time_ms}` |
| `/api/v1/analytics/summary` | `GET` | Dashboard KPI counters | `?time_range=24h` | `{total, processed, errors, success_rate}` |
| `/api/v1/analytics/timeline` | `GET` | Time-series log volume by severity | `?interval=1h` | `[{time: "...", error: 12, info: 84}]` |
| `/api/v1/analytics/sources` | `GET` | Distribution by log source / type | None | `[{source: "Linux", count: 74100}]` |
| `/api/v1/parsers` | `GET` | List active parser plugins | None | `[{id, name, version, status}]` |
| `/api/v1/parsers` | `POST` | Register dynamic custom parser | `{name, regex, field_mapping}` | `{id, status, message}` |
| `/api/v1/jobs` | `GET` | List processing jobs & progress | `?limit=20` | `[{job_id, total, processed, status}]` |
| `/api/v1/jobs/{id}/retry` | `POST` | Reprocess failed records in DLQ | None | `{reprocessed_count, resolved_count}` |

---

## 11. Frontend Studio & Dashboard Blueprint

The user interface is engineered as an enterprise-grade observability studio with a dark modern aesthetic (zinc/slate color palette, violet/cyan accents, and crisp typography using Inter and JetBrains Mono).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [ULPF LOG STUDIO]   Dashboard   Upload   Explorer   Parsers   Analytics     │
├─────────────────────────────────────────────────────────────────────────────┤
│ TOTAL LOGS       SUCCESS RATE       ERROR LOGS       AVG PROCESSING SPEED   │
│ 1,248,510        99.82%             14,290           18,400 logs/sec        │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ LOG INGESTION & SEVERITY TIMELINE    │ LOGS BY SOURCE TYPE                  │
│ [ 30-day Time-Series Bar Chart ]     │ Linux Syslog  ████████████ 42%       │
│ ■ Critical  ■ Error  ■ Warn  ■ Info  │ AWS JSON      ████████     28%       │
│                                      │ Nginx / Web   █████        18%       │
│                                      │ Windows Evt   ███          12%       │
├──────────────────────────────────────┴──────────────────────────────────────┤
│ LIVE PROCESSING JOBS                                                        │
│ JOB ID    SOURCE           RECORDS   DETECTED FORMAT   STATUS     PROGRESS  │
│ #8912     prod-k8s.json    100,000   JSON (CloudWatch) COMPLETED  [100%]    │
│ #8913     auth.log         45,000    Linux Syslog      PROCESSING [ 74%]    │
│ #8914     apache_access    12,800    Apache Combined   QUEUED     [  0%]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key UI Features
1. **Interactive Ingestion Sandbox**:
   - Drag-and-drop file upload with live client-side preview of the first 20 lines.
   - Real-time format detection badge (e.g. `Syslog RFC 3164 (98.4% confidence)`).
   - "Instant Run": Tests parsing on 10 lines and displays side-by-side JSON comparison before processing massive files.
2. **Enterprise Log Explorer**:
   - Filter bar: Date Range Picker, Multi-Select Severity, Hostname dropdown, IP search.
   - High-performance virtualized table rendering thousands of logs without UI lag.
   - Drawer Inspector: Clicking any row opens a slide-over panel displaying the **Universal Log Schema**, color-coded JSON attributes, and the original raw unparsed log.
3. **Parser Plugin Playground**:
   - Web-based regex and delimiter sandbox.
   - Test custom log lines with live field extraction highlights.
   - One-click plugin activation/deactivation.

---

## 12. Smart India Hackathon (SIH 2026) Winning Strategy

To guarantee maximum score in hackathon evaluations, ULPF addresses every core evaluation criterion:

### 1. Innovation & Novelty (Weight: 25%)
- Most teams create another chat interface or simple CSV reader. ULPF is a **genuine data engineering framework** addressing the foundational bottleneck of the cybersecurity and DevOps industry.
- The combination of **probabilistic format detection**, **Drain algorithm template mining**, and **automated PII redaction** showcases deep systems engineering.

### 2. Technical Feasibility & Architecture (Weight: 25%)
- Clean separation of concerns: Plugin-based parser registry, decoupled raw and processed storage, and Pydantic v2 type safety.
- Clear path from Phase 1 (Single Node FastAPI + React) to Phase 2 (Distributed Kafka + OpenSearch).

### 3. Impact & Business Viability (Weight: 20%)
- Solves the multi-million dollar "observability tax" that enterprises pay to vendors like Splunk, Datadog, and Cribl.
- Empowers government agencies, financial institutions, and SMEs to ingest disparate logs without hiring teams of data engineers to write custom parsers.

### 4. Live Demonstration & Pitch Flow (Weight: 30%)
A 5-minute judge demonstration designed to impress:
- **Minute 0:00 - 1:00 (The Hook)**: Show 4 completely different log files (Linux Syslog, AWS JSON, Nginx Access, Windows Event XML). Explain the nightmare of querying them together in one query.
- **Minute 1:00 - 2:30 (The Magic)**: Drag and drop all 4 files simultaneously into ULPF. Watch the engine automatically identify every format in $<200\text{ ms}$, process 50,000 records, and normalize them into a single unified dashboard.
- **Minute 2:30 - 3:30 (The Security & PII Redaction)**: Inspect a parsed record with a raw leaked credit card and password; show that ULPF automatically masked the password and validated the credit card with the Luhn algorithm.
- **Minute 3:30 - 4:15 (The Unknown Log Test)**: Paste a weird custom application log never seen before. Watch the Drain algorithm cluster it into an extracted template, and demonstrate the one-click AI parser rule generator.
- **Minute 4:15 - 5:00 (Architecture & Q&A)**: Walk through the clean FastAPI + PostgreSQL architecture and present the Kafka/OpenSearch distributed scaling roadmap.

---

## 13. Step-by-Step Implementation Roadmap

```
Sprint 1: Core Engine & Schemas
├── Define Pydantic Universal Schema models (ULS v1.0)
├── Implement BaseParser abstract interface
├── Implement JSONParser, SyslogParser, ApacheParser, NginxParser
└── Implement Multi-Stage Format Detection Engine

Sprint 2: Cleaning, Redaction, & Database
├── Implement whitespace cleaner and timestamp normalizer (18+ formats)
├── Implement PII/Secret Redaction Engine (Regex + Luhn validation)
├── Build SQLAlchemy 2.0 async models and PostgreSQL tables
└── Implement Dead-Letter Queue (DLQ) isolation logic

Sprint 3: FastAPI Backend & Services
├── Build REST APIs (/upload, /process, /logs, /search, /analytics, /parsers)
├── Implement AsyncIO background worker queue for chunked batch parsing
├── Implement JWT authentication and role-based permissions
└── Write unit and integration test suite with synthetic dirty log datasets

Sprint 4: React 18 + Tailwind Frontend
├── Build Dashboard with KPI metrics, timeline charts, and live job status
├── Build Drag-and-Drop Ingestion Studio with real-time detection preview
├── Build Virtualized Log Explorer with multi-faceted filtering & JSON drawer
└── Build Parser Plugin Playground

Sprint 5: Advanced & AI Modules
├── Implement Drain algorithm for unsupervised template extraction
├── Add LLM parser generator prompt helper for custom/unknown formats
└── Implement Anomaly & Burst Detection on normalized event streams

Sprint 6: Packaging & SIH Polish
├── Dockerize frontend, backend, and PostgreSQL with docker-compose.yml
├── Seed database with realistic multi-source enterprise log samples
├── Prepare SIH pitch slides, architecture diagrams, and live demo script
└── Final end-to-end performance benchmarking and stress tests
```

---
*Report prepared for ULPF (Universal Log Pre-processing Framework) — SIH 2026 Enterprise Observability Project.*
