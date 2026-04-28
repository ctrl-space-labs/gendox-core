# gendox-sdk

Python SDK for the Gendox Document Digitization API.

Provides a CLI tool (`gendox digitize`) and a Python library for automating the full document digitization pipeline: upload → link → split & train → execute → export.

---

## Installation

```bash
pip3 install -e path/to/gendox-python-sdk

# Verify
gendox --help
```

---

## Quick start — CLI

Create a `.env` file in your working directory:

```env
GENDOX_TOKEN=Bearer eyJ...
GENDOX_API_URL=https://dev-app.gendox.dev/gendox/api/v1
GENDOX_ORG_ID=9de504d4-...
GENDOX_PROJECT_ID=32ae0a6b-...
GENDOX_TASK_ID=aa4fc298-...
```

Drop files into `input/` and run:

```bash
gendox digitize
```

Common options:

```bash
gendox digitize --clean-task          # delete old data, then run fresh
gendox digitize --skip-upload         # re-run task on already-uploaded files
gendox digitize --export-format all   # export csv + markdown + json
gendox digitize --resume              # resume an interrupted run
```

---

## Quick start — Python library

```python
from pathlib import Path
from gendox import GendoxClient

client = GendoxClient(
    token="Bearer eyJ...",
    api_url="https://dev-app.gendox.dev/gendox/api/v1",
    org_id="9de504d4-...",
    project_id="32ae0a6b-...",
)

summary = client.digitization.run(
    task_id="aa4fc298-...",
    input_folder=Path("./input"),
    output_folder=Path("./output"),
    export_format="all",
)

print(f"Uploaded: {len(summary.upload_ok)} ok, {len(summary.upload_failed)} failed")
print(f"Exported: {len(summary.export_ok)} ok, {len(summary.export_failed)} failed")
```

---

## Documentation

Full documentation is in the [`documentation/`](documentation/) folder:

| Document | Description |
|---|---|
| [Getting Started](documentation/getting-started.md) | Step-by-step setup, credentials, troubleshooting |
| [CLI Reference](documentation/cli-reference.md) | All flags, env variables, recipes, output format |
| [Python API Reference](documentation/api-reference.md) | `GendoxClient`, `DigitizationService`, models, exceptions |
| [Pipeline Internals](documentation/pipeline.md) | How each step works, resume behavior, HTTP client |
| [Contributing](documentation/contributing.md) | How to add a new service, coding conventions, tests |
| [Changelog](documentation/changelog.md) | Version history |

---

## Running tests

```bash
cd gendox-python-sdk
pip install -e ".[dev]"
python3 -m pytest -v
python3 -m pytest --cov=gendox --cov-report=term-missing
```
