# Pipeline Internals

The `DigitizationService.run()` method executes up to six steps in sequence. Each step is also available as a standalone method for advanced use cases.

---

## Overview

```
Step 0: Cleanup        (only with clean=True)
Step 1: Upload         (only without skip_upload=True)
Step 2: Link           (only without skip_upload=True)
Step 3: Split & Train  (only without skip_upload=True)
Step 4: Execute
Step 5: Export
```

---

## Step 0 — Cleanup

**Triggered by**: `clean=True` (CLI: `--clean-task`)

Fetches all task nodes of type `DOCUMENT` for the given task and deletes them one by one via `DELETE /task-nodes/{nodeId}`.

Failures are collected and returned in `RunSummary.cleanup_failed` — the pipeline continues even if some nodes cannot be deleted.

**Use when**: You want a completely fresh run. Old results from previous uploads are removed before new files are uploaded.

---

## Step 1 — Upload

**Triggered by**: `skip_upload=False` (default)

Scans `input_folder` for files with supported extensions and uploads each one via `POST /documents/upload-single` with a multipart form body. Upload timeout per file is 180 seconds.

Supported extensions: `.pdf` `.docx` `.doc` `.xls` `.xlsx` `.txt` `.md` `.rst`

Each upload result is recorded as an `UploadResult`. Failures are collected and do not stop the pipeline — only successfully uploaded files proceed to the link step.

Raises `GendoxAPIError` if no supported files exist in the input folder.

---

## Step 2 — Link

**Triggered by**: `skip_upload=False` and at least one successful upload

Links uploaded documents to the task by creating `DOCUMENT` task nodes via `POST /task-nodes/batch`.

Each node includes:
- `taskId` — the target task
- `nodeType` — `"DOCUMENT"`
- `documentId` — the UUID returned by the upload step
- `nodeValue.documentMetadata.prompt` — the prompt string (empty string if not provided)

Raises `GendoxAPIError` if the batch creation fails.

---

## Step 3 — Split & Train

**Triggered by**: `skip_upload=False` and at least one document was linked

Triggers the Split & Train job via `GET /splitting/training?jobName=SPLITTER_AND_TRAINING&projectId={projectId}`.

Then polls `GET /jobs?size=5&sort=jobExecutionId,desc` every 5 seconds until the job reaches a terminal state:

| Status | Outcome |
|---|---|
| `COMPLETED` | Continues to next step |
| `FAILED` / `STOPPED` / `ABANDONED` | Raises `GendoxAPIError` |
| Still running after 600 seconds | Raises `GendoxTimeoutError` |

**What this step does**: Splits each document into sections, generates embeddings for each section, and stores them in the vector database. This makes the documents searchable and enables AI processing in the next step.

---

## Step 4 — Execute

Starts the Document Digitization task via `POST /tasks/{taskId}/execute`.

Then polls the same `/jobs` endpoint as Step 3 until the job completes (same timeout: 600 seconds).

**What this step does**: The Gendox AI agent processes each document section using the prompt you provided, generating ANSWER nodes that contain the structured results (e.g. extracted tables).

---

## Step 5 — Export

Fetches all `DOCUMENT` task nodes, then for each one produces output files in the requested format(s).

### CSV format

Calls `GET /tasks/{taskId}/documents/{nodeId}/digitization/export-csv` and saves the raw response as a `.csv` file.

### Markdown format

Fetches `ANSWER` nodes for each document, sorts them by page order, and concatenates the raw model output into a single `.md` file. Each page is separated by an HTML comment:

```
<!-- Page 1 -->
| Column A | Column B |
|---|---|
| value | value |

<!-- Page 2 -->
...
```

### JSON format

Same as markdown, but each page's markdown table is parsed into a list of row dictionaries with an added `_page` field:

```json
[
  {"Column A": "value", "Column B": "value", "_page": 1},
  ...
]
```

### Output file naming

All files are saved as:

```
{output_folder}/{document_name}_{YYYYMMDD_HHMMSS}.{ext}
```

The `document_name` is the stem of the original filename (fetched from the API). The timestamp is shared across all files in one `run()` call.

---

## Resume

When `resume=True`, the pipeline reads a state file at `output/.gendox_run_state.json` (if it exists) and skips already-completed steps.

The state file is written after each step completes and deleted when the full run succeeds. If a run is interrupted (crash, timeout, Ctrl+C), the state file is preserved for the next run.

### State file structure

```json
{
  "cleaned": true,
  "trained": true,
  "uploaded": [
    {"file": "invoice_jan.pdf", "doc_id": "abc123-..."},
    {"file": "report_q1.xlsx",  "doc_id": "def456-..."}
  ],
  "executed": true
}
```

### Resume behavior

| State | What is skipped |
|---|---|
| `cleaned: true` | Cleanup step |
| `trained: true` | Upload + Link + Split & Train |
| `executed: true` | Execute step |
| _(always runs)_ | Export step (always re-runs to get fresh results) |

**Usage**:

```bash
# First run — interrupted mid-way
gendox digitize

# Resume — picks up where it left off
gendox digitize --resume
```

---

## HTTP client behavior

All API calls go through `HttpClient`, which provides:

- **Auth**: `Authorization: Bearer {token}` header on every request. The `Bearer ` prefix is added automatically if missing.
- **Retry**: 5xx responses and network errors are retried up to 3 times with exponential backoff (1s, 2s, 4s by default).
- **No retry on 4xx**: Client errors (400, 401, 403, 404) are not retried.
- **401 → `GendoxAuthError`**: Raised immediately without retry.
- **Default timeout**: 120 seconds per request (overridden to 180s for file uploads and 60s for CSV export).
