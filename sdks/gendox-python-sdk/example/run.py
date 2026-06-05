"""
Minimal end-to-end example: upload → process → export.

Setup
-----
1. Copy .env.example to .env and fill in your credentials.
2. Drop one or more files into the input/ folder.
3. Run:  python run.py
Results appear in output/.
"""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

from gendox import GendoxClient, GendoxAuthError, GendoxAPIError, GendoxTimeoutError

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

INPUT_FOLDER = Path(__file__).parent / "input"
OUTPUT_FOLDER = Path(__file__).parent / "output"

INPUT_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)


def on_progress(step: str, message: str) -> None:
    print(f"[{step}] {message}")


def main() -> None:
    client = GendoxClient(
        token=os.environ["GENDOX_TOKEN"],
        api_url=os.environ["GENDOX_API_URL"],
        org_id=os.environ["GENDOX_ORG_ID"],
        project_id=os.environ["GENDOX_PROJECT_ID"],
    )

    try:
        summary = client.digitization.run(
            task_id=os.environ["GENDOX_TASK_ID"],
            input_folder=INPUT_FOLDER,
            output_folder=OUTPUT_FOLDER,
            prompt=os.getenv("GENDOX_DOCUMENT_PROMPT", ""),
            export_format=os.getenv("GENDOX_EXPORT_FORMAT", "csv"),
            clean=False,
            on_progress=on_progress,
        )
    except GendoxAuthError:
        print("ERROR: Invalid token. Check GENDOX_TOKEN in your .env file.")
        raise SystemExit(1)
    except GendoxTimeoutError:
        print("ERROR: Task timed out. Re-run with --resume or increase timeout.")
        raise SystemExit(1)
    except GendoxAPIError as exc:
        print(f"ERROR: API error — {exc}")
        raise SystemExit(1)

    print("\n--- Summary ---")
    print(f"Uploaded : {len(summary.upload_ok)} ok, {len(summary.upload_failed)} failed")
    print(f"Exported : {len(summary.export_ok)} ok, {len(summary.export_failed)} failed")

    if summary.total_failures:
        print("\nFailed uploads:")
        for r in summary.upload_failed:
            print(f"  {r.file}: {r.error}")
        print("\nFailed exports:")
        for r in summary.export_failed:
            print(f"  node {r.node_id} ({r.fmt}): {r.error}")
        raise SystemExit(1)

    print(f"\nDone. Results saved to: {OUTPUT_FOLDER.resolve()}")


if __name__ == "__main__":
    main()
