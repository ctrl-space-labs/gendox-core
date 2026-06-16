# Gendox SDK — Quick Start Example

## 1. Install the SDK

```bash
# From the gendox-core repo:
pip3 install -e ../

# Or from a private GitHub repo:
# pip3 install git+https://github.com/yourorg/gendox-python-sdk.git
```

## 2. Configure credentials

```bash
cp .env.example .env
# Open .env and fill in your token, org_id, project_id, task_id
```

## 3. Add input files

Drop any supported files into the `input/` folder:

```
example/
└── input/
    ├── invoice_jan.pdf
    └── report_q1.xlsx
```

Supported types: `.pdf` `.docx` `.doc` `.xls` `.xlsx` `.txt` `.md` `.rst`

## 4. Run

```bash
python3 run.py
```

Results are saved to `output/` named `{document_name}_{YYYYMMDD_HHMMSS}.{ext}`.

## Common options

| What you want | How |
|---|---|
| Delete old data before uploading | Set `clean=True` in `run.py` |
| Skip upload, just re-export | Set `skip_upload=True` in `run.py` |
| Export all formats at once | Set `export_format="all"` in `.env` |
| Resume an interrupted run | Set `resume=True` in `run.py` |

## Troubleshooting

| Error | Fix |
|---|---|
| `GendoxAuthError` | Check `GENDOX_TOKEN` — must include `"Bearer "` prefix |
| `GendoxTimeoutError` | Task took too long; re-run with `resume=True` |
| `GendoxAPIError` | Check `GENDOX_API_URL`, `GENDOX_ORG_ID`, `GENDOX_PROJECT_ID`, `GENDOX_TASK_ID` |
| No files uploaded | Check that `input/` contains supported file types |
