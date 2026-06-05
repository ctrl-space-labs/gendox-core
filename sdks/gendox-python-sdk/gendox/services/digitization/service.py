import json
import logging
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Callable, Iterator, Optional

from ...exceptions import GendoxAPIError, GendoxTimeoutError
from ..._http import HttpClient
from .models import CleanupFailure, Document, ExportResult, RunSummary, TaskNode, UploadResult

logger = logging.getLogger("gendox.digitization")

_POLL_INTERVAL = 5
_POLL_TIMEOUT = 600
_TERMINAL = {"COMPLETED", "FAILED", "STOPPED", "ABANDONED", "UNKNOWN"}
_SUPPORTED_EXT = {".txt", ".md", ".rst", ".pdf", ".docx", ".doc", ".xls", ".xlsx"}
_EXPORT_FORMATS = {"csv", "markdown", "json", "all"}
_DEFAULT_PAGE_SIZE = 200


def _parse_markdown_table(text: str) -> list[dict]:
    """Convert a markdown table string into a list of row dicts."""
    lines = [l for l in text.strip().splitlines() if l.strip().startswith("|")]
    if len(lines) < 3:
        return []

    def split_row(line: str) -> list[str]:
        return [c.strip() for c in re.split(r"(?<!\\)\|", line.strip().strip("|"))]

    headers = split_row(lines[0])
    rows = []
    for line in lines[2:]:
        cells = split_row(line)
        while len(cells) < len(headers):
            cells.append("")
        rows.append(dict(zip(headers, cells[: len(headers)])))
    return rows


def _stem_from_name(name: str) -> str:
    return Path(name).stem if name else ""


class DigitizationService:
    def __init__(self, http: HttpClient, api_url: str, org_id: str, project_id: str):
        self._http = http
        self._project_id = project_id
        self._base = f"{api_url}/organizations/{org_id}/projects/{project_id}"

    # ── internal helpers ─────────────────────────────────────────────────────

    def _emit(self, callback: Optional[Callable], step: str, message: str) -> None:
        logger.info("[%s] %s", step, message)
        if callback:
            callback(step, message)

    def _poll(self, label: str, callback: Optional[Callable] = None) -> None:
        url = f"{self._base}/jobs?size=5&sort=jobExecutionId,desc"
        deadline = time.time() + _POLL_TIMEOUT
        last_status = None

        while time.time() < deadline:
            resp = self._http.get(url)
            if resp.status_code != 200:
                raise GendoxAPIError(f"Polling failed: {resp.status_code}")

            jobs = resp.json().get("content", [])
            if not jobs:
                time.sleep(_POLL_INTERVAL)
                continue

            status = jobs[0].get("status", "UNKNOWN")
            if status != last_status:
                self._emit(callback, label, f"Status: {status}")
                last_status = status

            if status in _TERMINAL:
                if status == "COMPLETED":
                    return
                raise GendoxAPIError(f"{label} ended with status: {status}")

            time.sleep(_POLL_INTERVAL)

        raise GendoxTimeoutError(f"Timeout waiting for {label} after {_POLL_TIMEOUT}s")

    def _paginate(
        self, url: str, page_size: int = _DEFAULT_PAGE_SIZE
    ) -> Iterator[dict]:
        """Yield every item from a Spring Data-style paginated endpoint.

        Stops when the API returns ``last: true`` or a short page, so the caller
        doesn't need to know how many pages exist. Raises GendoxAPIError on any
        non-200 response.
        """
        separator = "&" if "?" in url else "?"
        page = 0
        while True:
            paged_url = f"{url}{separator}page={page}&size={page_size}"
            resp = self._http.get(paged_url)
            if resp.status_code != 200:
                raise GendoxAPIError(
                    f"Failed to paginate {url}: {resp.status_code}"
                )
            data = resp.json()
            content = data.get("content", []) or []
            yield from content

            # Prefer the explicit ``last`` flag when the API provides it;
            # otherwise fall back to a short-page heuristic.
            if "last" in data:
                if data["last"] is True or not content:
                    return
            elif len(content) < page_size:
                return
            page += 1

    def _get_nodes_by_type(self, task_id: str, node_type: str) -> list[TaskNode]:
        """Fetch all task nodes (across pages) and return the ones matching node_type."""
        url = f"{self._base}/tasks/{task_id}/task-nodes"
        nodes = [TaskNode.model_validate(n) for n in self._paginate(url)]
        return [n for n in nodes if n.node_type_name == node_type]

    def _resolve_doc_stems(self, doc_nodes: list[TaskNode]) -> dict[str, str]:
        """Return {node_id: filename_stem} by fetching each document from the API."""
        stems: dict[str, str] = {}
        for node in doc_nodes:
            fallback = node.id[:8]
            if not node.documentId:
                stems[node.id] = fallback
                continue
            try:
                resp = self._http.get(f"{self._base}/documents/{node.documentId}")
                if resp.status_code != 200:
                    logger.warning(
                        "Could not fetch document %s: %s", node.documentId, resp.status_code
                    )
                    stems[node.id] = fallback
                    continue
                doc = Document.model_validate(resp.json())
                stems[node.id] = _stem_from_name(doc.display_name) or fallback
            except Exception as e:
                logger.warning("Error fetching document %s: %s", node.documentId, e)
                stems[node.id] = fallback
        return stems

    @staticmethod
    def _save_state(path: Path, state: dict) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(state, indent=2))

    # ── public API ───────────────────────────────────────────────────────────

    def cleanup(self, task_id: str, on_progress: Optional[Callable] = None) -> dict:
        """Delete all existing DOCUMENT task nodes for the given task."""
        self._emit(on_progress, "cleanup", "Fetching existing document nodes...")

        doc_nodes = self._get_nodes_by_type(task_id, "DOCUMENT")
        if not doc_nodes:
            self._emit(on_progress, "cleanup", "No document nodes found — nothing to delete")
            return {"deleted": 0, "failed": []}

        self._emit(on_progress, "cleanup", f"Deleting {len(doc_nodes)} node(s)...")
        deleted, failed = 0, []

        for node in doc_nodes:
            resp = self._http.delete(f"{self._base}/task-nodes/{node.id}")
            if resp.status_code in (200, 204):
                deleted += 1
                logger.debug("Deleted node %s", node.id)
            else:
                failed.append(
                    CleanupFailure(node_id=node.id, reason=f"{resp.status_code} {resp.text[:120]}")
                )
                logger.warning("Could not delete node %s: %s", node.id, resp.status_code)

        self._emit(on_progress, "cleanup", f"Deleted {deleted}/{len(doc_nodes)} nodes")
        return {"deleted": deleted, "failed": failed}

    def upload(self, input_folder: Path, on_progress: Optional[Callable] = None) -> list[UploadResult]:
        """Upload all supported files from input_folder. Continues on individual failures."""
        url = f"{self._base}/documents/upload-single"
        candidates = [
            f for f in input_folder.iterdir()
            if f.is_file() and f.suffix.lower() in _SUPPORTED_EXT
        ]

        if not candidates:
            raise GendoxAPIError(
                f"No supported files in {input_folder}. "
                f"Supported: {', '.join(sorted(_SUPPORTED_EXT))}"
            )

        self._emit(on_progress, "upload", f"Uploading {len(candidates)} file(s)...")
        results = []

        for file_path in candidates:
            try:
                with open(file_path, "rb") as fh:
                    resp = self._http.post(
                        url,
                        files=[("file", (file_path.name, fh))],
                        timeout=180,
                    )
                if resp.status_code not in (200, 201):
                    reason = f"{resp.status_code} {resp.text[:120]}"
                    logger.warning("Upload failed for %s: %s", file_path.name, reason)
                    results.append(UploadResult(file=file_path.name, error=reason))
                    continue

                doc_id = resp.json().get("id")
                if not doc_id:
                    results.append(UploadResult(file=file_path.name, error="response missing 'id'"))
                    continue

                logger.info("Uploaded %s → %s", file_path.name, doc_id)
                results.append(UploadResult(file=file_path.name, doc_id=str(doc_id)))

            except Exception as e:
                logger.warning("Exception uploading %s: %s", file_path.name, e)
                results.append(UploadResult(file=file_path.name, error=str(e)))

        ok = sum(1 for r in results if r.ok)
        self._emit(on_progress, "upload", f"Uploaded {ok}/{len(candidates)} file(s)")
        return results

    def link(
        self,
        task_id: str,
        doc_ids: list[str],
        prompt: str = "",
        on_progress: Optional[Callable] = None,
    ) -> None:
        """Create DOCUMENT task nodes linking uploaded documents to the task."""
        if not doc_ids:
            logger.warning("No document IDs to link — skipping")
            return

        payload = [
            {
                "taskId": task_id,
                "nodeType": "DOCUMENT",
                "documentId": doc_id,
                "nodeValue": {"documentMetadata": {"prompt": prompt or "", "structure": ""}},
            }
            for doc_id in doc_ids
        ]

        resp = self._http.post(
            f"{self._base}/task-nodes/batch",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        if resp.status_code not in (200, 201):
            raise GendoxAPIError(f"Failed to link documents: {resp.status_code} {resp.text[:200]}")

        self._emit(on_progress, "link", f"Linked {len(doc_ids)} document(s) to task")

    def split_and_train(self, on_progress: Optional[Callable] = None) -> None:
        """Trigger Split & Train job and wait for completion."""
        self._emit(on_progress, "split_and_train", "Triggering Split & Train...")
        url = (
            f"{self._base}/splitting/training"
            f"?jobName=SPLITTER_AND_TRAINING&projectId={self._project_id}"
        )
        resp = self._http.get(url)
        if resp.status_code != 200:
            raise GendoxAPIError(f"Failed to trigger Split & Train: {resp.status_code} {resp.text[:200]}")
        self._poll("split_and_train", on_progress)
        self._emit(on_progress, "split_and_train", "Completed")

    def execute(self, task_id: str, on_progress: Optional[Callable] = None) -> None:
        """Execute the Document Digitization task and wait for completion."""
        self._emit(on_progress, "execute", "Starting Document Digitization task...")
        resp = self._http.post(
            f"{self._base}/tasks/{task_id}/execute",
            json={},
            headers={"Content-Type": "application/json"},
        )
        if resp.status_code not in (200, 202):
            raise GendoxAPIError(f"Failed to execute task: {resp.status_code} {resp.text[:200]}")
        self._poll("execute", on_progress)
        self._emit(on_progress, "execute", "Completed")

    def export(
        self,
        task_id: str,
        output_folder: Path,
        fmt: str = "csv",
        on_progress: Optional[Callable] = None,
        timestamp: Optional[str] = None,
    ) -> list[ExportResult]:
        """
        Export digitization results.

        fmt: "csv" | "markdown" | "json" | "all"
          - csv:      uses the /export-csv endpoint (one file per document node)
          - markdown: raw model output combined across pages (one .md per document node)
          - json:     markdown table parsed into JSON rows (one .json per document node)
          - all:      produces all three formats
        """
        if fmt not in _EXPORT_FORMATS:
            raise ValueError(f"Invalid format '{fmt}'. Choose from: {_EXPORT_FORMATS}")

        ts = timestamp or datetime.now().strftime("%Y%m%d_%H%M%S")
        output_folder.mkdir(parents=True, exist_ok=True)
        doc_nodes = self._get_nodes_by_type(task_id, "DOCUMENT")

        if not doc_nodes:
            self._emit(on_progress, "export", "No document nodes found for this task")
            return []

        formats = ["csv", "markdown", "json"] if fmt == "all" else [fmt]
        self._emit(
            on_progress, "export",
            f"Exporting {len(doc_nodes)} document(s) as {fmt}..."
        )

        doc_stems = self._resolve_doc_stems(doc_nodes)

        needs_answers = any(f in ("markdown", "json") for f in formats)
        all_answers = self._get_nodes_by_type(task_id, "ANSWER") if needs_answers else []

        results = []
        for node in doc_nodes:
            stem = doc_stems.get(node.id, node.id[:8])
            page_answers = sorted(
                [
                    n for n in all_answers
                    if (n.nodeValue or {}).get("nodeDocumentId") == node.id
                ],
                key=lambda n: (n.nodeValue or {}).get("order", 0),
            )
            for f in formats:
                result = self._export_one(task_id, node.id, stem, ts, output_folder, f, page_answers)
                results.append(result)
                if result.ok:
                    logger.info("Saved: %s", result.path)
                else:
                    logger.warning(
                        "Export failed for node %s (%s): %s", node.id, f, result.error
                    )

        ok = sum(1 for r in results if r.ok)
        self._emit(on_progress, "export", f"Saved {ok}/{len(results)} file(s) → {output_folder}")
        return results

    def _export_one(
        self,
        task_id: str,
        node_id: str,
        stem: str,
        timestamp: str,
        output_folder: Path,
        fmt: str,
        page_answers: list[TaskNode],
    ) -> ExportResult:
        base_name = f"{stem}_{timestamp}"
        try:
            if fmt == "csv":
                url = (
                    f"{self._base}/tasks/{task_id}"
                    f"/documents/{node_id}/digitization/export-csv"
                )
                resp = self._http.get(url, timeout=60)
                if resp.status_code != 200:
                    return ExportResult(
                        node_id=node_id, fmt=fmt,
                        error=f"{resp.status_code} {resp.text[:120]}",
                    )
                out = output_folder / f"{base_name}.csv"
                out.write_bytes(resp.content)
                return ExportResult(node_id=node_id, fmt=fmt, path=str(out))

            elif fmt == "markdown":
                if not page_answers:
                    return ExportResult(node_id=node_id, fmt=fmt, error="No ANSWER nodes found")
                combined = "\n\n".join(
                    f"<!-- Page {(n.nodeValue or {}).get('order', 0)} -->\n"
                    f"{(n.nodeValue or {}).get('message', '')}"
                    for n in page_answers
                )
                out = output_folder / f"{base_name}.md"
                out.write_text(combined, encoding="utf-8")
                return ExportResult(node_id=node_id, fmt=fmt, path=str(out))

            elif fmt == "json":
                if not page_answers:
                    return ExportResult(node_id=node_id, fmt=fmt, error="No ANSWER nodes found")
                all_rows = []
                for n in page_answers:
                    rows = _parse_markdown_table((n.nodeValue or {}).get("message", ""))
                    for row in rows:
                        row["_page"] = (n.nodeValue or {}).get("order", 0)
                    all_rows.extend(rows)
                out = output_folder / f"{base_name}.json"
                out.write_text(json.dumps(all_rows, ensure_ascii=False, indent=2), encoding="utf-8")
                return ExportResult(node_id=node_id, fmt=fmt, path=str(out))

            else:
                return ExportResult(node_id=node_id, fmt=fmt, error=f"Unknown format: {fmt}")

        except Exception as e:
            return ExportResult(node_id=node_id, fmt=fmt, error=str(e))

    def run(
        self,
        task_id: str,
        input_folder: Path,
        output_folder: Path,
        prompt: str = "",
        clean: bool = False,
        skip_upload: bool = False,
        export_format: str = "csv",
        on_progress: Optional[Callable] = None,
        resume: bool = False,
    ) -> RunSummary:
        """
        Run the full digitization pipeline:
          0. (optional) Cleanup old DOCUMENT nodes
          1. Upload files
          2. Link documents to task
          3. Split & Train
          4. Execute task
          5. Export results

        Set resume=True to skip already-completed steps from a previous interrupted run.
        State is stored in output_folder/.gendox_run_state.json and deleted on success.
        """
        summary = RunSummary()
        run_ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        state_file = output_folder / ".gendox_run_state.json"
        state: dict = {}

        if resume and state_file.exists():
            state = json.loads(state_file.read_text())
            logger.info("Resuming from state file: %s", state_file)

        # Step 0: Cleanup
        if clean and not state.get("cleaned"):
            result = self.cleanup(task_id, on_progress)
            summary.cleanup_deleted = result["deleted"]
            summary.cleanup_failed = result["failed"]
            state["cleaned"] = True
            self._save_state(state_file, state)

        # Steps 1–3: Upload → Link → Train
        if not skip_upload and not state.get("trained"):
            upload_results = self.upload(input_folder, on_progress)
            summary.uploads = upload_results

            doc_ids = [r.doc_id for r in upload_results if r.ok]
            if doc_ids:
                self.link(task_id, doc_ids, prompt, on_progress)
                self.split_and_train(on_progress)

            state["trained"] = True
            state["uploaded"] = [
                {"file": r.file, "doc_id": r.doc_id} for r in upload_results if r.ok
            ]
            self._save_state(state_file, state)

        # Step 4: Execute
        if not state.get("executed"):
            self.execute(task_id, on_progress)
            state["executed"] = True
            self._save_state(state_file, state)

        # Step 5: Export
        export_results = self.export(task_id, output_folder, export_format, on_progress, run_ts)
        summary.exports = export_results

        # Remove state file on successful completion
        if state_file.exists():
            state_file.unlink()

        return summary
