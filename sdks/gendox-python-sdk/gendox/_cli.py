"""CLI entry point for the Gendox SDK."""

import argparse
import json
import logging
import os
import sys
from pathlib import Path

from dotenv import find_dotenv, load_dotenv

from .client import GendoxClient
from .exceptions import GendoxError


def _setup_logging(verbose: bool) -> None:
    logging.basicConfig(
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
        level=logging.DEBUG if verbose else logging.WARNING,
    )


def _require(key: str, override: str = None) -> str:
    value = (override or os.getenv(key, "")).strip()
    if not value:
        print(f"[ERROR] Missing required config '{key}' — set it in .env or pass as an argument.")
        sys.exit(1)
    return value


# Each entry: (format_name, description, api_endpoint_hint)
_FORMAT_MENU = [
    ("csv",      "spreadsheet",        "API endpoint: /digitization/export-csv"),
    ("json",     "structured records", "parsed from ANSWER node JSON messages"),
    ("markdown", "raw model output",   "combined text from ANSWER node messages"),
    ("all",      "all three formats",  "csv + json + markdown"),
]
_VALID_FORMATS = {f[0] for f in _FORMAT_MENU}


def _prompt_export_format() -> str:
    """Interactively ask the user to choose an export format."""
    print("\nSelect export format:")
    for i, (fmt, label, hint) in enumerate(_FORMAT_MENU, start=1):
        print(f"  {i}) {fmt:<10} {label:<22} ({hint})")
    print()
    while True:
        raw = input("Enter choice [1 = csv]: ").strip()
        if raw == "":
            return "csv"
        if raw.isdigit() and 1 <= int(raw) <= len(_FORMAT_MENU):
            return _FORMAT_MENU[int(raw) - 1][0]
        if raw.lower() in _VALID_FORMATS:
            return raw.lower()
        print(f"  Invalid. Enter a number 1–{len(_FORMAT_MENU)} or: {', '.join(f[0] for f in _FORMAT_MENU)}")


def _on_progress(step: str, message: str) -> None:
    print(f"  [{step}] {message}")


def _add_digitize_args(parser: argparse.ArgumentParser) -> None:
    parser.formatter_class = argparse.RawDescriptionHelpFormatter
    parser.epilog = (
        "─── .env variables ─────────────────────────────────────────\n"
        "  GENDOX_TOKEN           Bearer token (F12 → Network → Authorization)\n"
        "  GENDOX_API_URL         e.g. https://dev-app.gendox.dev/gendox/api/v1\n"
        "  GENDOX_ORG_ID          Organization UUID\n"
        "  GENDOX_PROJECT_ID      Project UUID\n"
        "  GENDOX_TASK_ID         Document Digitization Task UUID\n"
        "  GENDOX_INPUT_FOLDER    Folder with files to upload  (default: ./input)\n"
        "  GENDOX_OUTPUT_FOLDER   Folder where results are saved (default: ./output)\n"
        "  GENDOX_DOCUMENT_PROMPT Prompt attached to every document node\n"
        "  GENDOX_EXPORT_FORMAT   csv | json | markdown | all  (prompts if not set)\n"
        "  GENDOX_SKIP_UPLOAD     true → skip upload+train step\n"
        "  GENDOX_CLEAN_TASK      true → delete old DOCUMENT nodes before upload\n"
        "  GENDOX_PAGES_CONFIG    Path to JSON file mapping filename → {page_from, page_to}\n"
        "\n"
        "─── export formats ─────────────────────────────────────────\n"
        "  csv        API /digitization/export-csv    → saves a .csv file\n"
        "  json       Parses JSON from ANSWER nodes   → saves a .json file\n"
        "  markdown   Text from ANSWER nodes          → saves a .md file\n"
        "  all        Runs all three formats\n"
        "\n"
        "─── examples ───────────────────────────────────────────────\n"
        "  gendox digitize\n"
        "  gendox digitize --clean-task\n"
        "  gendox digitize --skip-upload\n"
        "  gendox digitize --skip-upload --export-format json\n"
        "  gendox digitize --resume\n"
        "  gendox digitize --pages-config pages.json\n"
    )
    parser.add_argument("--token",           default=None, help="Override GENDOX_TOKEN")
    parser.add_argument("--api-url",         default=None, help="Override GENDOX_API_URL")
    parser.add_argument("--org-id",          default=None, help="Override GENDOX_ORG_ID")
    parser.add_argument("--project-id",      default=None, help="Override GENDOX_PROJECT_ID")
    parser.add_argument("--task-id",         default=None, help="Override GENDOX_TASK_ID")
    parser.add_argument("--input-folder",    default=None, help="Override GENDOX_INPUT_FOLDER")
    parser.add_argument("--output-folder",   default=None, help="Override GENDOX_OUTPUT_FOLDER")
    parser.add_argument("--document-prompt", default=None, help="Override GENDOX_DOCUMENT_PROMPT")
    parser.add_argument(
        "--export-format", default=None,
        choices=["csv", "json", "markdown", "all"],
        help="Output format — skips the interactive prompt",
    )
    parser.add_argument("--skip-upload", action="store_true",
                        help="Skip upload step (files already uploaded)")
    parser.add_argument("--clean-task", action="store_true",
                        help="Delete existing DOCUMENT nodes before upload")
    parser.add_argument("--resume", action="store_true",
                        help="Resume a previously interrupted run")
    parser.add_argument("--pages-config", default=None,
                        help="Path to a JSON file mapping filename → {page_from, page_to} "
                             "or a list of ranges [{page_from, page_to}, ...] for non-contiguous pages")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Enable debug logging")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="gendox",
        description="Gendox SDK — command-line interface",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "─── available commands ──────────────────────────────────────\n"
            "  gendox digitize            Run the full document digitization pipeline\n"
            "\n"
            "─── get help for a command ──────────────────────────────────\n"
            "  gendox digitize --help     Show all flags, env variables, and examples\n"
        ),
    )
    subparsers = parser.add_subparsers(dest="service", metavar="COMMAND")
    subparsers.required = True

    digitize = subparsers.add_parser(
        "digitize",
        help="Run the full document digitization pipeline  →  try: gendox digitize --help",
        description="Gendox Document Digitization — automated pipeline",
    )
    _add_digitize_args(digitize)

    return parser


def _run_digitize(args: argparse.Namespace) -> None:
    token      = _require("GENDOX_TOKEN",     args.token)
    api_url    = _require("GENDOX_API_URL",    args.api_url)
    org_id     = _require("GENDOX_ORG_ID",     args.org_id)
    project_id = _require("GENDOX_PROJECT_ID", args.project_id)
    task_id    = _require("GENDOX_TASK_ID",    args.task_id)

    cwd = Path.cwd()
    input_folder  = Path(args.input_folder  or os.getenv("GENDOX_INPUT_FOLDER",  "input"))
    output_folder = Path(args.output_folder or os.getenv("GENDOX_OUTPUT_FOLDER", "output"))
    if not input_folder.is_absolute():
        input_folder = cwd / input_folder
    if not output_folder.is_absolute():
        output_folder = cwd / output_folder

    prompt      = (args.document_prompt or os.getenv("GENDOX_DOCUMENT_PROMPT", "")).strip()
    skip_upload = args.skip_upload or os.getenv("GENDOX_SKIP_UPLOAD", "false").lower() == "true"
    clean_task  = args.clean_task  or os.getenv("GENDOX_CLEAN_TASK",  "false").lower() == "true"

    pages_config: dict | None = None
    _pages_config_path = args.pages_config or os.getenv("GENDOX_PAGES_CONFIG", "").strip()
    if not _pages_config_path and (cwd / "pages.json").exists():
        _pages_config_path = str(cwd / "pages.json")
    if _pages_config_path:
        p = Path(_pages_config_path)
        if not p.is_absolute():
            p = cwd / p
        if not p.exists():
            print(f"[ERROR] --pages-config file not found: {p}")
            sys.exit(1)
        pages_config = json.loads(p.read_text())

    # Format: flag → env var → interactive prompt
    env_format    = os.getenv("GENDOX_EXPORT_FORMAT", "").strip().lower()
    export_format = args.export_format or (env_format if env_format in _VALID_FORMATS else None)
    if export_format is None:
        export_format = _prompt_export_format()

    print("=" * 60)
    print("  Gendox Document Digitization")
    print("=" * 60)
    print(f"  API:        {api_url}")
    print(f"  Org:        {org_id}")
    print(f"  Project:    {project_id}")
    print(f"  Task:       {task_id}")
    print(f"  Input:      {input_folder}")
    print(f"  Output:     {output_folder}")
    print(f"  Format:     {export_format}")
    print(f"  Clean:      {clean_task}  |  Skip upload: {skip_upload}  |  Resume: {args.resume}")
    if pages_config:
        print(f"  Pages:      per-file config ({len(pages_config)} file(s))")
    if prompt:
        print(f"  Prompt:     {prompt[:80]}{'…' if len(prompt) > 80 else ''}")
    print("=" * 60)

    client = GendoxClient(token=token, api_url=api_url, org_id=org_id, project_id=project_id)

    try:
        summary = client.digitization.run(
            task_id=task_id,
            input_folder=input_folder,
            output_folder=output_folder,
            prompt=prompt,
            clean=clean_task,
            skip_upload=skip_upload,
            export_format=export_format,
            on_progress=_on_progress,
            resume=args.resume,
            pages_config=pages_config,
        )
    except GendoxError as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)

    if clean_task:
        print(f"  Cleanup:  {summary.cleanup_deleted} deleted, {len(summary.cleanup_failed)} failed")

    if not skip_upload and summary.uploads:
        print(f"  Upload:   {len(summary.upload_ok)} ok, {len(summary.upload_failed)} failed")
        for u in summary.upload_failed:
            print(f"              - {u.file}: {u.error}")

    print(f"  Export:   {len(summary.export_ok)} saved, {len(summary.export_failed)} failed")
    for e in summary.export_failed:
        print(f"              - node {e.node_id} ({e.fmt}): {e.error}")

    print("=" * 60)
    if summary.total_failures == 0:
        print("  ✓ All operations completed successfully.")
    else:
        print(f"  ⚠  Completed with {summary.total_failures} non-fatal failure(s).")
    print("=" * 60 + "\n")


def main() -> None:
    load_dotenv(find_dotenv(usecwd=True))
    args = _build_parser().parse_args()
    _setup_logging(getattr(args, "verbose", False))

    if args.service == "digitize":
        _run_digitize(args)


if __name__ == "__main__":
    main()
