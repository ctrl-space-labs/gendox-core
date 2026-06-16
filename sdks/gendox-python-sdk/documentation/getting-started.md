# Getting Started

## Requirements

- Python 3.10 or later
- `pip3` (bundled with Python)
- A Gendox account with an organization, project, and Document Digitization task already created

---

## Installation

Install the SDK globally so the `gendox` CLI is available anywhere in your terminal:

```bash
pip3 install -e path/to/gendox-python-sdk
```

Verify the installation:

```bash
gendox --help
gendox digitize --help
```

> **Editable install (`-e`)**: changes to the SDK source files take effect immediately — no reinstall needed.

---

## Configuration

The SDK reads credentials from a `.env` file in your working directory or from environment variables. Create a `.env` file:

```env
GENDOX_TOKEN=Bearer eyJ...
GENDOX_API_URL=https://dev-app.gendox.dev/gendox/api/v1
GENDOX_ORG_ID=9de504d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GENDOX_PROJECT_ID=32ae0a6b-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GENDOX_TASK_ID=aa4fc298-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Where to find each value

| Variable | How to get it |
|---|---|
| `GENDOX_TOKEN` | Open Gendox in your browser → F12 → Network tab → click any request → copy the `Authorization` header. It starts with `Bearer `. |
| `GENDOX_API_URL` | The base URL of your Gendox instance, e.g. `https://dev-app.gendox.dev/gendox/api/v1` |
| `GENDOX_ORG_ID` | Visible in the Gendox UI URL: `/gendox/home/{org_id}/...` |
| `GENDOX_PROJECT_ID` | Visible in the Gendox UI URL: `.../projects/{project_id}/...` |
| `GENDOX_TASK_ID` | Open your Document Digitization task in Gendox — the UUID is in the URL |

---

## First run — CLI

1. Create a working directory and add your `.env` file:

   ```bash
   mkdir my-digitization
   cd my-digitization
   # create .env with the variables above
   ```

2. Drop your documents into an `input/` subfolder:

   ```
   my-digitization/
   ├── .env
   └── input/
       ├── document_jan.pdf
       └── report_q1.xlsx
   ```

   Supported file types: `.pdf` `.docx` `.doc` `.xls` `.xlsx` `.txt` `.md` `.rst`

3. Run:

   ```bash
   gendox digitize
   ```

   Results are saved to `output/` named `{document_name}_{YYYYMMDD_HHMMSS}.{ext}`.

---

## First run — Python script

```python
import os
from pathlib import Path
from dotenv import load_dotenv
from gendox import GendoxClient

load_dotenv()

client = GendoxClient(
    token=os.environ["GENDOX_TOKEN"],
    api_url=os.environ["GENDOX_API_URL"],
    org_id=os.environ["GENDOX_ORG_ID"],
    project_id=os.environ["GENDOX_PROJECT_ID"],
)

summary = client.digitization.run(
    task_id=os.environ["GENDOX_TASK_ID"],
    input_folder=Path("./input"),
    output_folder=Path("./output"),
)

print(f"Uploaded: {len(summary.upload_ok)} ok, {len(summary.upload_failed)} failed")
print(f"Exported: {len(summary.export_ok)} ok, {len(summary.export_failed)} failed")
```

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `[ERROR] Missing required config 'GENDOX_TOKEN'` | `.env` not found | Make sure `.env` is in the directory where you run `gendox digitize`, not a parent folder |
| `GendoxAuthError` | Token invalid or missing `Bearer ` prefix | Copy the full `Authorization` header from the browser — it must start with `Bearer ` (capital B, space after) |
| `GendoxTimeoutError` | Task took more than 10 minutes | Re-run with `gendox digitize --resume` |
| `GendoxAPIError` | Wrong org/project/task ID or wrong API URL | Double-check all four UUIDs and the `GENDOX_API_URL` |
| `FileNotFoundError: .../scripts/input` | Old `GENDOX_INPUT_FOLDER=scripts/input` in `.env` | Remove `GENDOX_INPUT_FOLDER` from `.env` or set it to `input` |
| No files uploaded | No supported files in `input/` | Check file extensions: only `.pdf .docx .doc .xls .xlsx .txt .md .rst` are supported |
| `command not found: gendox` | SDK not installed or PATH issue | Run `pip3 install -e path/to/gendox-python-sdk` again |
