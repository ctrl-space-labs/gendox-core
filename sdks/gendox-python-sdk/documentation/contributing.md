# Contributing to gendox-python-sdk

## Project layout

```
gendox-python-sdk/
├── documentation/           # All documentation (you are here)
├── example/                 # Minimal end-to-end usage example
├── gendox/
│   ├── __init__.py          # Public API — add exports here when adding a service
│   ├── client.py            # GendoxClient — wire new services here
│   ├── exceptions.py        # Shared error hierarchy
│   ├── _http.py             # HttpClient (retry, backoff, auth)
│   ├── _cli.py              # CLI entry point
│   └── services/
│       └── digitization/    # One folder per service
│           ├── __init__.py  # Re-exports service + models
│           ├── service.py   # Business logic
│           └── models.py    # Pydantic models
└── tests/
    ├── conftest.py          # Shared fixtures
    ├── test_cli.py          # CLI argument parsing and main() tests
    ├── test_http.py         # HttpClient tests
    └── services/
        └── digitization/    # Tests mirror source layout
            ├── test_service.py
            └── test_models.py
```

---

## Adding a new service

Follow these five steps — use `digitization` as the reference implementation.

### Step 1 — Create the service folder

```
gendox/services/<name>/
├── __init__.py
├── service.py
└── models.py
```

**`models.py`** — Pydantic models for API responses and results:

```python
from pydantic import BaseModel, computed_field, ConfigDict
from typing import Optional

class MyResult(BaseModel):
    item_id: str
    error: Optional[str] = None

    @computed_field
    @property
    def ok(self) -> bool:
        return self.error is None
```

**`service.py`** — service class that receives `HttpClient`:

```python
import logging
from ..._http import HttpClient
from ...exceptions import GendoxAPIError
from .models import MyResult

logger = logging.getLogger("gendox.<name>")


class MyService:
    def __init__(self, http: HttpClient, api_url: str, org_id: str, project_id: str):
        self._http = http
        self._base = f"{api_url}/organizations/{org_id}/projects/{project_id}"

    def do_something(self, param: str) -> MyResult:
        data = self._http.get(f"{self._base}/something/{param}")
        return MyResult(**data)
```

**`__init__.py`** — re-export so callers use a clean import path:

```python
from .service import MyService
from .models import MyResult

__all__ = ["MyService", "MyResult"]
```

### Step 2 — Wire into `client.py`

```python
from .services.<name> import MyService

class GendoxClient:
    def __init__(self, ...):
        ...
        self.<name> = MyService(self._http, api_url.rstrip("/"), org_id, project_id)
```

### Step 3 — Export from `gendox/__init__.py`

```python
from .services.<name>.models import MyResult

__all__ = [
    ...
    "MyResult",
]
```

### Step 4 — Write tests

Mirror the source layout under `tests/services/<name>/`:

```
tests/services/<name>/
├── __init__.py        # empty
├── test_service.py
└── test_models.py
```

Use the `service` and `api_base` fixtures pattern from `tests/conftest.py`. Add a fixture for your new service in `conftest.py`:

```python
from gendox.services.<name> import MyService

@pytest.fixture
def my_service(http_client):
    return MyService(http_client, API_URL, ORG_ID, PROJECT_ID)
```

Decorate every test that makes HTTP calls with `@responses.activate` and register mock responses before calling service methods:

```python
import responses

@responses.activate
def test_do_something(self, my_service):
    responses.add(responses.GET, f"{API_URL}/.../something/foo", json={"item_id": "foo"})
    result = my_service.do_something("foo")
    assert result.ok
```

Patch `time.sleep` if your service polls:

```python
from unittest.mock import patch

with patch("gendox.services.<name>.service.time.sleep"):
    ...
```

### Step 5 — Run the full test suite

```bash
cd gendox-python-sdk
python3 -m pytest -v
```

All existing tests must still pass before opening a PR.

---

## HTTP client conventions

`HttpClient` (in `gendox/_http.py`) exposes three methods:

| Method | Signature | Notes |
|---|---|---|
| `get` | `get(url, **kwargs) -> Response` | Auto-retries on 5xx and network errors |
| `post` | `post(url, **kwargs) -> Response` | — |
| `delete` | `delete(url, **kwargs) -> Response` | — |

Raises:
- `GendoxAuthError` — on HTTP 401
- `GendoxAPIError` — on any other non-2xx after retries exhausted
- `GendoxTimeoutError` — when a polling loop exceeds its timeout

Import them with relative paths (3 levels up from `gendox/services/<name>/service.py`):

```python
from ..._http import HttpClient
from ...exceptions import GendoxAPIError, GendoxTimeoutError
```

---

## Error hierarchy

```
GendoxError
├── GendoxAPIError      # non-2xx HTTP response
├── GendoxAuthError     # 401 Unauthorized
└── GendoxTimeoutError  # polling timeout
```

All live in `gendox/exceptions.py`. Do not add new exception classes unless they represent a truly distinct failure mode that callers need to catch separately.

---

## Coding conventions

- No business logic in `client.py` — it only wires dependencies.
- Services receive `HttpClient` via constructor — never instantiate it inside a service.
- Models use Pydantic v2 (`BaseModel`, `computed_field`, `ConfigDict`).
- Use `extra="allow"` on API response models so unknown fields from the API don't break the SDK.
- Logger name pattern: `"gendox.<service_name>"`.
- No comments unless the WHY is non-obvious.

---

## Running tests

```bash
cd gendox-python-sdk

# Install dev dependencies (one-time)
pip install -e ".[dev]"

# All tests
python3 -m pytest -v

# Coverage
python3 -m pytest --cov=gendox --cov-report=term-missing

# Single file
python3 -m pytest tests/services/digitization/test_service.py -v
```
