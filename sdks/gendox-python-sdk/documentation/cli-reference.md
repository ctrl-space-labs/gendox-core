# CLI Reference

The `gendox` CLI is installed automatically when you `pip install` the SDK.

## Commands

```
gendox <command> [options]
```

Currently available commands:

| Command | Description |
|---|---|
| `digitize` | Run the full Document Digitization pipeline |

---

## `gendox digitize`

Runs the pipeline: upload files → link to task → split & train → execute → export results.

### Usage

```bash
gendox digitize [options]
```

### All options

| Flag | Env variable | Default | Description |
|---|---|---|---|
| `--token TOKEN` | `GENDOX_TOKEN` | _(required)_ | Bearer token. Must include the `Bearer ` prefix. |
| `--api-url URL` | `GENDOX_API_URL` | _(required)_ | API base URL, e.g. `https://dev-app.gendox.dev/gendox/api/v1` |
| `--org-id UUID` | `GENDOX_ORG_ID` | _(required)_ | Organization UUID |
| `--project-id UUID` | `GENDOX_PROJECT_ID` | _(required)_ | Project UUID |
| `--task-id UUID` | `GENDOX_TASK_ID` | _(required)_ | Document Digitization task UUID |
| `--input-folder PATH` | `GENDOX_INPUT_FOLDER` | `./input` | Folder containing files to upload |
| `--output-folder PATH` | `GENDOX_OUTPUT_FOLDER` | `./output` | Folder where results are saved |
| `--document-prompt TEXT` | `GENDOX_DOCUMENT_PROMPT` | _(empty)_ | AI prompt attached to every document node |
| `--export-format FORMAT` | `GENDOX_EXPORT_FORMAT` | `csv` | Output format: `csv` / `markdown` / `json` / `all` |
| `--skip-upload` | `GENDOX_SKIP_UPLOAD=true` | false | Skip upload + train — re-run task on already-uploaded files |
| `--clean-task` | `GENDOX_CLEAN_TASK=true` | false | Delete existing DOCUMENT nodes before uploading |
| `--resume` | — | false | Resume a previously interrupted run |
| `--verbose` / `-v` | — | false | Enable debug logging |

### Precedence

CLI flags override environment variables. Environment variables override defaults.

```
CLI flag  >  .env variable  >  built-in default
```

### .env file

The CLI looks for a `.env` file in the directory where you run the command (current working directory). It does not search parent directories.

Example `.env`:

```env
GENDOX_TOKEN=Bearer eyJhbGci...
GENDOX_API_URL=https://dev-app.gendox.dev/gendox/api/v1
GENDOX_ORG_ID=9de504d4-8381-441c-b731-42024114e28c
GENDOX_PROJECT_ID=32ae0a6b-f5eb-4a32-b53e-3b76ff32a598
GENDOX_TASK_ID=aa4fc298-5a3b-40fb-9910-e3c819415f4d
GENDOX_DOCUMENT_PROMPT=Extract all tables from this scanned page and return them in markdown format.
GENDOX_EXPORT_FORMAT=csv
GENDOX_CLEAN_TASK=false
GENDOX_SKIP_UPLOAD=false
```

---

## Common recipes

### Full run (default)

Upload all files in `./input`, run the task, save CSV results to `./output`:

```bash
gendox digitize
```

### Fresh start — delete old data, then upload and run

```bash
gendox digitize --clean-task
```

### Re-run without re-uploading (files already in Gendox)

```bash
gendox digitize --skip-upload
```

### Export all formats at once

```bash
gendox digitize --skip-upload --export-format all
```

This produces `.csv`, `.md`, and `.json` files for each document.

### Resume an interrupted run

```bash
gendox digitize --resume
```

Reads the state file at `output/.gendox_run_state.json` and skips already-completed steps. See [Pipeline internals](pipeline.md#resume) for details.

### Use a different input/output folder

```bash
gendox digitize --input-folder /data/scans --output-folder /data/results
```

Paths can be absolute or relative to the current directory.

### Pass credentials as flags (no .env file)

```bash
gendox digitize \
  --token "Bearer eyJ..." \
  --api-url "https://dev-app.gendox.dev/gendox/api/v1" \
  --org-id "9de504d4-..." \
  --project-id "32ae0a6b-..." \
  --task-id "aa4fc298-..."
```

### Debug mode

```bash
gendox digitize --verbose
```

Prints every HTTP request, retry attempt, and pipeline step to stderr.

---

## Output

### Console output

```
============================================================
  Gendox Document Digitization
============================================================
  API:        https://dev-app.gendox.dev/gendox/api/v1
  Org:        9de504d4-...
  Project:    32ae0a6b-...
  Task:       aa4fc298-...
  Input:      /home/user/work/input
  Output:     /home/user/work/output
  Format:     csv
  Clean:      False  |  Skip upload: False  |  Resume: False
============================================================
  [cleanup] ...
  [upload] Uploading 3 file(s)...
  [upload] Uploaded 3/3 file(s)
  [link] Linked 3 document(s) to task
  [split_and_train] Status: STARTED
  [split_and_train] Status: COMPLETED
  [execute] Status: STARTED
  [execute] Status: COMPLETED
  [export] Exporting 3 document(s) as csv...
  [export] Saved 3/3 file(s) → /home/user/work/output

============================================================
  SUMMARY
============================================================
  Upload:   3 ok, 0 failed
  Export:   3 saved, 0 failed
============================================================
  ✓ All operations completed successfully.
============================================================
```

### Output files

Files are saved to the output folder named:

```
{document_name}_{YYYYMMDD_HHMMSS}.{ext}
```

| Format | Extension | Content |
|---|---|---|
| `csv` | `.csv` | Structured table exported from the Gendox API |
| `markdown` | `.md` | Raw AI model output per page, concatenated |
| `json` | `.json` | Markdown tables parsed into JSON row arrays |
| `all` | `.csv` + `.md` + `.json` | All three formats for each document |

---

## Exit codes

| Code | Meaning |
|---|---|
| `0` | All operations completed (non-fatal failures are reported but don't affect exit code) |
| `1` | Fatal error (missing config, auth failure, API error, unhandled exception) |
