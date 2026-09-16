# 🚀 ULPF — Universal Log Pre-processing Framework

[![CI Tests](https://img.shields.io/badge/tests-22%20passed-emerald)](https://github.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **One-Line Pitch:** A plug-and-play platform that ingests logs from heterogeneous sources (Linux, Apache, Nginx, Windows, AWS CloudWatch, CSV, Custom Apps), automatically detects their format, parses and cleans them, masks sensitive credentials, normalizes them into a unified **Universal Log Schema**, and makes them instantly ready for analytics, monitoring, and security pipelines.

---

## 🎯 Problem Statement

Modern enterprise infrastructures are deeply heterogeneous:
```
Linux (Syslog)       ──>  Sep 13 10:32:21 server01 sshd: Failed password
AWS CloudWatch       ──>  {"timestamp": "2026-09-13T10:32:21Z", "status": 401, "message": "Unauthorized"}
Apache Access Log    ──>  192.168.1.45 - ronak [13/Sep/2026:10:32:21 +0000] "POST /login" 401 128
Windows Event Log    ──>  2026-09-13 10:32:21 [Security] EventID=4625 Level=Information Host=DC-01
Custom Application   ──>  [ERROR] 2026-09-13 10:32:21 Login failed user=ronak password=secret123
```
Companies are forced to write fragmented parsers, manual normalization logic, and disparate pipelines. **ULPF** unifies all heterogeneous formats into an immutable raw archive and a single, standardized, validated **Universal Log Schema**.

---

## 🏗️ Architectural Pipeline

```
                    LOG SOURCES
       [ Files (.log, .json, .csv) | Live Paste | REST API ]
                             │
                             ▼
                      INGESTION ENGINE
                             │
             ┌───────────────┴───────────────┐
             ▼                               ▼
     RAW LOG STORAGE                 FORMAT DETECTOR
(Immutable preservation in DB)    (Heuristic syntax & signature scanner)
                                             │
                                             ▼
                                      PARSER ENGINE
                               (Plugin-Based Architecture)
                 ┌───────────┬───────────┼───────────┬───────────┐
                 ▼           ▼           ▼           ▼           ▼
              Syslog      Apache       Nginx       JSON      Windows ...
                 └───────────┴───────────┬───────────┴───────────┘
                                         │
                                         ▼
                                   DATA CLEANER
                     (Whitespace, duplicates, null handling,
                    & Sensitive Data Masking: passwords/tokens)
                                         │
                                         ▼
                                    NORMALIZER
                        (UTC ISO-8601 timestamps, standard
                        severities: ERR/SEVERE -> ERROR)
                                         │
                                         ▼
                                 ENRICHMENT ENGINE
                           (GeoIP, ISP, threat tagging)
                                         │
                                         ▼
                                 VALIDATION ENGINE
                            (Pydantic Schema Validation:
                                 VALID vs. INVALID)
                                         │
                                         ▼
                                UNIVERSAL LOG SCHEMA
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
       Database (SQLite / PostgreSQL)                  Analytics & Search
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                             FASTAPI REST API GATEWAY
                                         │
                                         ▼
                      REACT + TYPESCRIPT + TAILWIND DASHBOARD
       (Live Ingestion Studio, Dual-View Log Explorer, Jobs Audit, Parser Studio)
```

---

## 🌎 The Universal Log Schema

Every processed log is guaranteed to conform to the following schema:

```json
{
  "id": "c92a1841-f592-4d2a-a951-873b889a9c21",
  "timestamp": "2026-09-13T10:32:21.000Z",
  "source": {
    "type": "linux",
    "name": "server01"
  },
  "severity": "ERROR",
  "event_type": "authentication",
  "message": "Failed password for invalid user ronak from 192.168.1.45 port 54821 ssh2",
  "host": "server01",
  "user": "ronak",
  "ip_address": "192.168.1.45",
  "application": "sshd",
  "environment": "production",
  "metadata": {
    "ip_geo": {
      "country": "Local",
      "city": "Private Network",
      "org": "Internal Infrastructure",
      "is_internal": true
    },
    "threat_level": "HIGH",
    "security_flag": true,
    "pid": "2841"
  }
}
```

### Mandatory Fields:
- `id` (UUID string)
- `timestamp` (UTC ISO-8601 string)
- `source` (`{ "type": string, "name": string }`)
- `severity` (`DEBUG | INFO | WARNING | ERROR | CRITICAL | UNKNOWN`)
- `message` (string)

---

## 🧠 Plugin-Based Parser Architecture

All parsers inherit from `BaseParser` (`backend/app/parsers/base.py`):
```python
class BaseParser(ABC):
    @abstractmethod
    def detect(self, sample_line: str) -> float: ...

    @abstractmethod
    def parse(self, line: str) -> Dict[str, Any]: ...

    def get_metadata(self) -> Dict[str, Any]: ...
```

### Pre-Installed Built-in Parsers:
1. **JSON Parser** (`json_parser.py`): Parses JSON lines, JSON arrays, and AWS CloudWatch events.
2. **Linux Syslog Parser** (`syslog_parser.py`): RFC 3164 (BSD) and RFC 5424 formats.
3. **Apache Web Parser** (`apache_parser.py`): Combined & Common Access logs.
4. **Nginx Parser** (`nginx_parser.py`): Nginx access and worker process error logs.
5. **Windows Parser** (`windows_parser.py`): Windows Security (Logon ID 4624/4625), System & App logs.
6. **CSV Parser** (`csv_parser.py`): Delimited logs with header autodetection.
7. **Generic Regex Parser** (`regex_parser.py`): Configurable regex capture groups for arbitrary formats.

---

## 🔐 Security & Sensitive Data Redaction

ULPF automatically intercepts sensitive data in raw logs before storing normalized output:
- **Passwords / Passphrases**: `password=SuperSecretPassword123!` $\rightarrow$ `password=********`
- **Bearer Tokens / JWTs**: `Bearer eyJhbGci...` $\rightarrow$ `Bearer [REDACTED_JWT_TOKEN]`
- **API Keys**: `api_key=sk_live_99281...` $\rightarrow$ `api_key=[REDACTED_API_KEY]`
- **Credit Cards**: `4111-2222-3333-4444` $\rightarrow$ `[REDACTED_CARD_NUMBER]`

---

## 📊 Mathematical Quality Metrics

Displayed live on the Dashboard & Analytics tabs:

$$ \text{Processing Success Rate} = \frac{\text{Processed Valid Logs}}{\text{Total Ingested Logs}} \times 100 $$

$$ \text{System Error Rate} = \frac{\text{Error Logs} + \text{Critical Logs}}{\text{Total Ingested Logs}} \times 100 $$

$$ \text{Average Batch Latency} = \frac{\sum \text{Processing Duration (ms)}}{\text{Total Processing Jobs}} $$

---

## ⚡ Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# In project root:
.\venv\Scripts\python.exe -m pip install -r backend/requirements.txt

# Seed sample datasets into the local database:
.\venv\Scripts\python.exe backend/seed_data.py

# Run the backend API:
.\venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
- Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- API Gateway: [http://127.0.0.1:8000/api/v1](http://127.0.0.1:8000/api/v1)

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Frontend UI: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Automated Test Suite

Run the full pytest suite (22 unit & integration tests):
```bash
.\venv\Scripts\pytest.exe -v
```
Tests cover:
- All parsers (JSON, Syslog, Apache, Nginx, Windows, CSV, Regex)
- Format detection accuracy
- Whitespace cleaning & sensitive data masking
- ISO-8601 UTC timestamp and severity normalizers
- Pydantic Universal Schema validation
- FastAPI REST API endpoints

---

## 🐳 Docker Deployment

```bash
# Start Backend and Frontend containers:
docker-compose up --build -d

# Start with PostgreSQL profile (production mode):
docker-compose --profile production up --build -d
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 📁 Repository Structure

```
SIH 2026/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, logs, jobs, analytics, parsers, sources)
│   │   ├── core/         # Config, Database engine, Security (JWT/passwords)
│   │   ├── detection/    # Automatic format detector
│   │   ├── models/       # SQLAlchemy ORM models (raw_logs, processed_logs, jobs, plugins)
│   │   ├── parsers/      # Plugin-based log parsers (Apache, Nginx, Syslog, Windows, JSON, CSV)
│   │   ├── processing/   # Cleaner, Normalizer, Enricher, Validator, Pipeline runner
│   │   └── schemas/      # Pydantic schemas (Universal Log Schema, Jobs, Detection, Analytics)
│   ├── tests/            # Pytest unit and integration test suites
│   ├── seed_data.py      # Sample log seeder script
│   ├── requirements.txt  # Backend dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # Navbar, Sidebar, modals
│   │   ├── pages/        # Dashboard, Ingestion Studio, Log Explorer, Jobs, Parsers, Analytics, Security
│   │   ├── services/     # Central API client
│   │   └── types/        # TypeScript type definitions
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── samples/              # Ready-to-test sample log sets (Apache, Nginx, Syslog, Windows, AWS, CSV)
├── docker-compose.yml
├── pytest.ini
└── README.md
```

---

## 🏆 SIH Hackathon Evaluation Highlights

1. **Not a chatbot**: Real high-performance data engineering pipeline.
2. **Zero Data Loss Guarantee**: Raw logs are stored immutably in `raw_logs` before parsing.
3. **True Plugin System**: New log formats are added via `BaseParser` without modifying core pipeline code.
4. **Smart Auto-Detection**: Heuristic pattern & syntax scoring identifies formats with >90% confidence.
5. **Side-by-Side Verification**: Real-time dual-view modal allows judges to compare raw input against the normalized Universal Schema.
6. **Built-in Security**: Automated redaction of passwords, JWT tokens, and API keys.
