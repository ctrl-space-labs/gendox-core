# Python API Reference

## `GendoxClient`

The main entry point. Import from the top-level package:

```python
from gendox import GendoxClient
```

### Constructor

```python
GendoxClient(
    token: str,
    api_url: str,
    org_id: str,
    project_id: str,
    max_retries: int = 3,
    backoff: float = 2.0,
)
```

| Parameter | Type | Description |
|---|---|---|
| `token` | `str` | Bearer token. The `Bearer ` prefix is added automatically if missing. |
| `api_url` | `str` | API base URL, e.g. `https://dev-app.gendox.dev/gendox/api/v1` |
| `org_id` | `str` | Organization UUID |
| `project_id` | `str` | Project UUID |
| `max_retries` | `int` | Maximum retry attempts for failed HTTP requests (default: 3) |
| `backoff` | `float` | Exponential backoff base in seconds (default: 2.0 → retries at 1s, 2s, 4s) |

### Attributes

| Attribute | Type | Description |
|---|---|---|
| `client.digitization` | `DigitizationService` | Document digitization pipeline |

### Example

```python
from pathlib import Path
from gendox import GendoxClient

client = GendoxClient(
    token="Bearer eyJ...",
    api_url="https://dev-app.gendox.dev/gendox/api/v1",
    org_id="9de504d4-...",
    project_id="32ae0a6b-...",
)
```

---

## `DigitizationService`

Accessed via `client.digitization`. Provides the full digitization pipeline and individual steps.

### `run()` — full pipeline

```python
client.digitization.run(
    task_id: str,
    input_folder: Path,
    output_folder: Path,
    prompt: str = "",
    clean: bool = False,
    skip_upload: bool = False,
    export_format: str = "csv",
    on_progress: Callable[[str, str], None] | None = None,
    resume: bool = False,
) -> RunSummary
```

Runs the complete pipeline (steps 0–5). Returns a `RunSummary`.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `task_id` | `str` | _(required)_ | Document Digitization task UUID |
| `input_folder` | `Path` | _(required)_ | Folder containing files to upload |
| `output_folder` | `Path` | _(required)_ | Folder where results are saved |
| `prompt` | `str` | `""` | AI prompt attached to every document node |
| `clean` | `bool` | `False` | Delete existing DOCUMENT nodes before uploading |
| `skip_upload` | `bool` | `False` | Skip upload + train — re-run task on existing documents |
| `export_format` | `str` | `"csv"` | `"csv"` / `"markdown"` / `"json"` / `"all"` |
| `on_progress` | `Callable` | `None` | Called on each progress event: `fn(step: str, message: str)` |
| `resume` | `bool` | `False` | Resume from a previous interrupted run |

---

### `cleanup()` — delete existing nodes

```python
client.digitization.cleanup(
    task_id: str,
    on_progress: Callable | None = None,
) -> dict
```

Deletes all existing `DOCUMENT` task nodes for the given task.

Returns `{"deleted": int, "failed": list[CleanupFailure]}`.

---

### `upload()` — upload files

```python
client.digitization.upload(
    input_folder: Path,
    on_progress: Callable | None = None,
) -> list[UploadResult]
```

Uploads all supported files from `input_folder`. Continues on individual failures.

Raises `GendoxAPIError` if no supported files are found.

Supported extensions: `.txt` `.md` `.rst` `.pdf` `.docx` `.doc` `.xls` `.xlsx`

---

### `link()` — attach documents to task

```python
client.digitization.link(
    task_id: str,
    doc_ids: list[str],
    prompt: str = "",
    on_progress: Callable | None = None,
) -> None
```

Creates `DOCUMENT` task nodes linking uploaded documents to the task. No-op if `doc_ids` is empty.

---

### `split_and_train()` — embed documents

```python
client.digitization.split_and_train(
    on_progress: Callable | None = None,
) -> None
```

Triggers the Split & Train job and waits for completion (up to 10 minutes). Raises `GendoxTimeoutError` on timeout.

---

### `execute()` — run the AI task

```python
client.digitization.execute(
    task_id: str,
    on_progress: Callable | None = None,
) -> None
```

Starts the Document Digitization task and polls until it completes (up to 10 minutes).

---

### `export()` — save results

```python
client.digitization.export(
    task_id: str,
    output_folder: Path,
    fmt: str = "csv",
    on_progress: Callable | None = None,
    timestamp: str | None = None,
) -> list[ExportResult]
```

Exports results for all `DOCUMENT` nodes.

| Parameter | Description |
|---|---|
| `fmt` | `"csv"` / `"markdown"` / `"json"` / `"all"` |
| `timestamp` | Optional timestamp string for file names (`YYYYMMDD_HHMMSS`). Generated automatically if omitted. |

---

## Progress callbacks

Any method that accepts `on_progress` will call it with `(step: str, message: str)` for each progress event.

```python
def on_progress(step: str, message: str) -> None:
    print(f"[{step}] {message}")

summary = client.digitization.run(
    ...,
    on_progress=on_progress,
)
```

Step names: `cleanup`, `upload`, `link`, `split_and_train`, `execute`, `export`.

---

## Models

### `RunSummary`

Returned by `run()`.

```python
class RunSummary:
    cleanup_deleted: int           # number of nodes deleted in cleanup step
    cleanup_failed: list[CleanupFailure]
    uploads: list[UploadResult]
    exports: list[ExportResult]

    # computed properties
    upload_ok:    list[UploadResult]   # uploads where .ok is True
    upload_failed: list[UploadResult]  # uploads where .ok is False
    export_ok:    list[ExportResult]   # exports where .ok is True
    export_failed: list[ExportResult]  # exports where .ok is False
    total_failures: int                # sum of all failures
```

### `UploadResult`

```python
class UploadResult:
    file: str           # original filename
    doc_id: str | None  # Gendox document UUID (None on failure)
    error: str | None   # error message (None on success)
    ok: bool            # True when doc_id is not None
```

### `ExportResult`

```python
class ExportResult:
    node_id: str        # task node UUID
    fmt: str            # "csv", "markdown", or "json"
    path: str | None    # absolute path of the saved file (None on failure)
    error: str | None   # error message (None on success)
    ok: bool            # True when path is not None
```

### `CleanupFailure`

```python
class CleanupFailure:
    node_id: str   # UUID of the node that could not be deleted
    reason: str    # HTTP status + response excerpt
```

### `Document` _(API response model)_

Parsed from `GET /documents/{id}`.

```python
class Document:
    id: str
    name: str | None
    title: str | None
    fileName: str | None
    originalFileName: str | None
    display_name: str  # computed: first non-empty of name/title/fileName/originalFileName/id
```

### `TaskNode` _(API response model)_

Parsed from `GET /tasks/{taskId}/task-nodes`.

```python
class TaskNode:
    id: str
    documentId: str | None
    nodeType: object | None    # can be {"name": "DOCUMENT"} or plain string
    nodeValue: dict | None
    node_type_name: str | None  # computed: normalizes nodeType to a plain string
```

---

## Exceptions

```python
from gendox import GendoxAuthError, GendoxAPIError, GendoxTimeoutError
```

| Exception | When raised |
|---|---|
| `GendoxError` | Base class for all SDK exceptions |
| `GendoxAuthError` | HTTP 401 — token is invalid or expired |
| `GendoxAPIError` | Any unexpected API response (wrong IDs, server error, etc.) |
| `GendoxTimeoutError` | Polling for a background job exceeded 600 seconds |

### Error handling example

```python
from gendox import GendoxClient, GendoxAuthError, GendoxAPIError, GendoxTimeoutError

client = GendoxClient(...)

try:
    summary = client.digitization.run(
        task_id="...",
        input_folder=Path("./input"),
        output_folder=Path("./output"),
    )
except GendoxAuthError:
    print("Token invalid — re-authenticate and update GENDOX_TOKEN")
except GendoxTimeoutError:
    print("Task timed out — re-run with resume=True")
except GendoxAPIError as e:
    print(f"API error: {e}")
```

Non-fatal errors (individual file upload failures, individual export failures) are recorded in `RunSummary` rather than raising an exception.

---

## Full example

```python
import os
from pathlib import Path
from dotenv import load_dotenv
from gendox import GendoxClient, GendoxAuthError, GendoxAPIError, GendoxTimeoutError

load_dotenv()


def on_progress(step: str, message: str) -> None:
    print(f"  [{step}] {message}")


client = GendoxClient(
    token=os.environ["GENDOX_TOKEN"],
    api_url=os.environ["GENDOX_API_URL"],
    org_id=os.environ["GENDOX_ORG_ID"],
    project_id=os.environ["GENDOX_PROJECT_ID"],
)

try:
    summary = client.digitization.run(
        task_id=os.environ["GENDOX_TASK_ID"],
        input_folder=Path("./input"),
        output_folder=Path("./output"),
        prompt="Extract all tables from this document.",
        clean=True,
        export_format="all",
        on_progress=on_progress,
    )
except GendoxAuthError:
    print("Authentication failed — check your token")
    raise
except GendoxTimeoutError:
    print("Timed out — re-run with resume=True")
    raise
except GendoxAPIError as e:
    print(f"API error: {e}")
    raise

print(f"\nUploaded: {len(summary.upload_ok)} ok, {len(summary.upload_failed)} failed")
print(f"Exported: {len(summary.export_ok)} ok, {len(summary.export_failed)} failed")

for r in summary.upload_failed:
    print(f"  Upload failed — {r.file}: {r.error}")

for r in summary.export_failed:
    print(f"  Export failed — node {r.node_id} ({r.fmt}): {r.error}")
```
