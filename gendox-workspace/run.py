"""
Gendox digitization — Python API alternative to the CLI.

Usage:
    source .venv/bin/activate
    python run.py

Reads all configuration from .env in the same directory.
Optional: create a pages.json to restrict which pages are digitized per file.
"""

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from gendox import GendoxClient, GendoxAuthError, GendoxAPIError, GendoxTimeoutError

load_dotenv(Path(__file__).parent / ".env")

HERE = Path(__file__).parent
INPUT_FOLDER = HERE / "input"
OUTPUT_FOLDER = HERE / "output"


def _require(key: str) -> str:
    value = os.getenv(key, "").strip()
    if not value:
        print(f"ERROR: Missing required variable '{key}' — set it in .env")
        sys.exit(1)
    return value


def _load_pages_config() -> dict | None:
    """Load pages.json if GENDOX_PAGES_CONFIG is set or pages.json exists next to run.py."""
    path_str = os.getenv("GENDOX_PAGES_CONFIG", "").strip()
    path = Path(path_str) if path_str else HERE / "pages.json"
    if not path.is_absolute():
        path = HERE / path
    if not path.exists():
        return None
    print(f"  [config] Loading page ranges from: {path.name}")
    return json.loads(path.read_text())


def on_progress(step: str, message: str) -> None:
    print(f"  [{step}] {message}")


def main() -> None:
    INPUT_FOLDER.mkdir(exist_ok=True)
    OUTPUT_FOLDER.mkdir(exist_ok=True)

    pages_config = _load_pages_config()

    client = GendoxClient(
        token=_require("GENDOX_TOKEN"),
        api_url=_require("GENDOX_API_URL"),
        org_id=_require("GENDOX_ORG_ID"),
        project_id=_require("GENDOX_PROJECT_ID"),
    )

    print("Starting digitization pipeline...")

    try:
        summary = client.digitization.run(
            task_id=_require("GENDOX_TASK_ID"),
            input_folder=INPUT_FOLDER,
            output_folder=OUTPUT_FOLDER,
            prompt=os.getenv("GENDOX_DOCUMENT_PROMPT", ""),
            export_format=os.getenv("GENDOX_EXPORT_FORMAT", "csv"),
            clean=os.getenv("GENDOX_CLEAN_TASK", "false").lower() == "true",
            skip_upload=os.getenv("GENDOX_SKIP_UPLOAD", "false").lower() == "true",
            pages_config=pages_config,
            on_progress=on_progress,
        )
    except GendoxAuthError:
        print("ERROR: Invalid token. Check GENDOX_TOKEN in .env (must include 'Bearer ' prefix).")
        sys.exit(1)
    except GendoxTimeoutError:
        print("ERROR: Task timed out. Re-run after setting GENDOX_SKIP_UPLOAD=true.")
        sys.exit(1)
    except GendoxAPIError as exc:
        print(f"ERROR: API error — {exc}")
        sys.exit(1)

    print(f"\nUploaded : {len(summary.upload_ok)} ok, {len(summary.upload_failed)} failed")
    print(f"Exported : {len(summary.export_ok)} ok, {len(summary.export_failed)} failed")

    if summary.total_failures:
        for r in summary.upload_failed:
            print(f"  upload failed — {r.file}: {r.error}")
        for r in summary.export_failed:
            print(f"  export failed — node {r.node_id} ({r.fmt}): {r.error}")
        sys.exit(1)

    print(f"\nDone. Results saved to: {OUTPUT_FOLDER.resolve()}")


if __name__ == "__main__":
    main()
