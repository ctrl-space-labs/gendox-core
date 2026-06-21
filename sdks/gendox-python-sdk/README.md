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

## Selecting pages per file

By default all pages of every uploaded file are processed. To restrict which pages are digitized, create a `pages.json` file in your working directory.

The file maps each filename to a page range or a list of ranges:

```json
{
  "report.pdf": { "page_from": 1, "page_to": 5 },
  "manual.pdf": [
    { "page_from": 10, "page_to": 15 },
    { "page_from": 22, "page_to": 26 }
  ]
}
```

- Files **not listed** in `pages.json` are processed with all pages.
- A **single range** (`{ "page_from": ..., "page_to": ... }`) processes those pages in one pass.
- A **list of ranges** processes each range sequentially, accumulating results — useful for non-contiguous sections of the same document.

`pages.json` is detected automatically by both `gendox digitize` and `run.py` when placed in the working directory. You can also point to a different file:

```bash
gendox digitize --pages-config path/to/my-pages.json
```

Or set the path in `.env`:

```env
GENDOX_PAGES_CONFIG=pages.json
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
    pages_config={
        "report.pdf": {"page_from": 1, "page_to": 5},
        "manual.pdf": [
            {"page_from": 10, "page_to": 15},
            {"page_from": 22, "page_to": 26},
        ],
    },
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
