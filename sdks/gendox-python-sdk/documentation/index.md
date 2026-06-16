# Gendox Python SDK — Documentation

Python SDK for the Gendox Document Digitization API.

## Contents

| Document | Description |
|---|---|
| [Getting Started](getting-started.md) | Installation, configuration, first run, troubleshooting |
| [CLI Reference](cli-reference.md) | All `gendox digitize` flags, env variables, and examples |
| [Python API Reference](api-reference.md) | `GendoxClient`, `DigitizationService`, models, exceptions |
| [Pipeline Internals](pipeline.md) | How each pipeline step works, resume behavior, HTTP client |
| [Contributing](contributing.md) | How to add a new service, coding conventions, test guide |
| [Changelog](changelog.md) | Version history |

---

## Quick links

- **Install**: `pip3 install -e path/to/gendox-python-sdk`
- **Run**: `gendox digitize` (from a folder with `.env` and `input/`)
- **Resume interrupted run**: `gendox digitize --resume`
- **Fresh start**: `gendox digitize --clean-task`
- **Export all formats**: `gendox digitize --skip-upload --export-format all`

---

## Package structure

```
gendox-python-sdk/
├── gendox/
│   ├── __init__.py                    # Public API exports
│   ├── client.py                      # GendoxClient entry point
│   ├── exceptions.py                  # GendoxError hierarchy
│   ├── _http.py                       # HttpClient (retry, backoff, auth)
│   ├── _cli.py                        # CLI entry point (gendox digitize)
│   └── services/
│       └── digitization/
│           ├── __init__.py            # Re-exports service + models
│           ├── service.py             # DigitizationService (pipeline logic)
│           └── models.py             # Pydantic models
├── tests/
│   ├── conftest.py
│   ├── test_cli.py
│   ├── test_http.py
│   └── services/digitization/
│       ├── test_service.py
│       └── test_models.py
├── documentation/                     # This documentation
├── example/                           # Minimal usage example
└── pyproject.toml
```

