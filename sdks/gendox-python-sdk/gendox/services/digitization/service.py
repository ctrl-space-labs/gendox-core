import csv
import io
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Callable, Iterator, Optional

from ...exceptions import GendoxAPIError, GendoxTimeoutError
from ..._http import HttpClient
from .models import (
    CleanupFailure,
    DocumentPageStatus,
    ExportResult,
    RunSummary,
    TaskNode,
    UploadResult,
)

logger = logging.getLogger("gendox.digitization")

_POLL_INTERVAL = 5
_POLL_TIMEOUT = 600
_TERMINAL = {"COMPLETED", "FAILED", "STOPPED", "ABANDONED", "UNKNOWN"}
_SUPPORTED_EXT = {".txt", ".md", ".rst", ".pdf", ".docx", ".doc", ".xls", ".xlsx"}
_EXPORT_FORMATS = {"csv", "json", "markdown", "all"}
_DEFAULT_PAGE_SIZE = 200


def _extract_json_from_message(message: str) -> list:
    """Extract a JSON array from an LLM message that may wrap it in a ```json code fence."""
    text = message.strip()
    # strip ```json ... ``` or ``` ... ``` fences
    if text.startswith("```"):
        lines = text.splitlines()
        # drop first line (```json or ```) and last line (```)
        inner_lines = lines[1:]
        if inner_lines and inner_lines[-1].strip() == "```":
            inner_lines = inner_lines[:-1]
        text = "\n".join(inner_lines).strip()
    return json.loads(text)


def _parse_export_csv(content: bytes) -> tuple[str, list[tuple[int, str]]]:
    """Parse a /export-csv response.

    Returns (document_title, pages) where pages is a sorted list of
    (page_number, cell_content) for every 'Page N' column.
    """
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    title = ""
    pages: list[tuple[int, str]] = []
    for row in reader:
        if not title:
            title = (row.get("Document Title") or "").strip()
        for col_name, cell_value in row.items():
            col = (col_name or "").strip()
            if col.lower().startswith("page "):
                try:
                    page_num = int(col.split()[-1])
                except ValueError:
                    continue
                if cell_value and cell_value.strip():
                    pages.append((page_num, cell_value.strip()))
    return title, sorted(pages, key=lambda x: x[0])


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

    def _poll(self, label: str, job_name: str, callback: Optional[Callable] = None) -> None:
        url = f"{self._base}/jobs?jobName={job_name}&size=5&sort=jobExecutionId,desc"
        deadline = time.time() + _POLL_TIMEOUT
        last_status = None
        seen_running = False  # must see at least one non-terminal status before accepting COMPLETED

        # Give the backend a moment to register the new job before the first poll
        time.sleep(3)

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

            if status not in _TERMINAL:
                seen_running = True

            if status in _TERMINAL:
                if not seen_running:
                    # stale result from a previous job — keep waiting
                    time.sleep(_POLL_INTERVAL)
                    continue
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

    def _paginate_post(
        self, url: str, json_body: dict, page_size: int = _DEFAULT_PAGE_SIZE
    ) -> Iterator[dict]:
        """Like :meth:`_paginate` but for POST endpoints that take a JSON body
        (e.g. the task-node criteria search) and page via query params."""
        separator = "&" if "?" in url else "?"
        page = 0
        while True:
            paged_url = f"{url}{separator}page={page}&size={page_size}"
            resp = self._http.post(
                paged_url,
                json=json_body,
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code != 200:
                raise GendoxAPIError(f"Failed to paginate {url}: {resp.status_code}")
            data = resp.json()
            content = data.get("content", []) or []
            yield from content

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

    def list_document_nodes(self, task_id: str) -> list[TaskNode]:
        """Return every DOCUMENT task node for the task (their ``id`` values are the
        document-node ids accepted by :meth:`execute` and :meth:`delete_answers`)."""
        return self._get_nodes_by_type(task_id, "DOCUMENT")

    def list_answer_nodes(self, task_id: str) -> list[TaskNode]:
        """Return every generated ANSWER task node for the task."""
        return self._get_nodes_by_type(task_id, "ANSWER")

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
            self._emit(on_progress, "cleanup", "No document nodes found - nothing to delete")
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
                        timeout=600,
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
        pages_map: Optional[dict[str, dict]] = None,
        on_progress: Optional[Callable] = None,
    ) -> None:
        """Create DOCUMENT task nodes linking uploaded documents to the task.

        pages_map maps doc_id → {"page_from": int, "page_to": int}.
        Documents not present in pages_map are processed with all pages.
        """
        if not doc_ids:
            logger.warning("No document IDs to link — skipping")
            return

        payload = []
        for doc_id in doc_ids:
            per_doc = (pages_map or {}).get(doc_id, {})
            metadata: dict = {"prompt": prompt or "", "structure": ""}
            if "page_from" in per_doc:
                metadata["pageFrom"] = per_doc["page_from"]
            if "page_to" in per_doc:
                metadata["pageTo"] = per_doc["page_to"]
            payload.append(
                {
                    "taskId": task_id,
                    "nodeType": "DOCUMENT",
                    "documentId": doc_id,
                    "nodeValue": {"documentMetadata": metadata},
                }
            )

        resp = self._http.post(
            f"{self._base}/task-nodes/batch",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        if resp.status_code not in (200, 201):
            raise GendoxAPIError(f"Failed to link documents: {resp.status_code} {resp.text[:200]}")

        self._emit(on_progress, "link", f"Linked {len(doc_ids)} document(s) to task")

    def _update_nodes_pages(
        self,
        task_id: str,
        round_docs: dict[str, dict],
        prompt: str = "",
        on_progress: Optional[Callable] = None,
    ) -> None:
        """PUT-update existing DOCUMENT nodes with new page params (preserves connected ANSWER nodes)."""
        doc_nodes = self._get_nodes_by_type(task_id, "DOCUMENT")
        node_by_doc = {n.documentId: n for n in doc_nodes}
        updated = 0
        for doc_id, page_range in round_docs.items():
            node = node_by_doc.get(doc_id)
            if not node:
                logger.warning("No DOCUMENT node found for doc %s — skipping update", doc_id)
                continue
            metadata: dict = {"prompt": prompt or "", "structure": ""}
            if "page_from" in page_range:
                metadata["pageFrom"] = page_range["page_from"]
            if "page_to" in page_range:
                metadata["pageTo"] = page_range["page_to"]
            payload = {
                "id": node.id,
                "taskId": task_id,
                "nodeType": "DOCUMENT",
                "documentId": doc_id,
                "nodeValue": {"documentMetadata": metadata},
            }
            resp = self._http.put(
                f"{self._base}/tasks/{task_id}/task-nodes",
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code not in (200, 201):
                logger.warning("Could not update node %s: %s %s", node.id, resp.status_code, resp.text[:120])
            else:
                updated += 1
        if updated:
            self._emit(on_progress, "link", f"Updated page range for {updated} node(s)")

    def execute(
        self,
        task_id: str,
        on_progress: Optional[Callable] = None,
        *,
        document_node_ids: Optional[list[str]] = None,
        regenerate: bool = False,
    ) -> None:
        """Execute the Document Digitization task and wait for completion.

        document_node_ids: restrict generation to these DOCUMENT task-node ids
            (from :meth:`list_document_nodes`). When omitted, every document node
            in the task is processed.
        regenerate: when False (default), the backend only generates pages that
            don't already have an answer (incremental — untouched pages are skipped).
            When True, it deletes existing answers and regenerates every page from
            scratch.
        """
        criteria: dict = {}
        if document_node_ids:
            criteria["documentNodeIds"] = list(document_node_ids)
        if regenerate:
            criteria["reGenerateExistingAnswers"] = True

        scope = f"{len(document_node_ids)} document node(s)" if document_node_ids else "all documents"
        mode = "regenerating existing answers" if regenerate else "new answers only"
        self._emit(on_progress, "execute", f"Starting Document Digitization task ({scope}, {mode})...")
        resp = self._http.post(
            f"{self._base}/tasks/{task_id}/execute",
            json=criteria,
            headers={"Content-Type": "application/json"},
        )
        if resp.status_code not in (200, 202):
            raise GendoxAPIError(f"Failed to execute task: {resp.status_code} {resp.text[:200]}")
        self._poll("execute", job_name="documentDigitizationJob", callback=on_progress)
        self._emit(on_progress, "execute", "Completed")

    def get_page_status(self, task_id: str) -> list[DocumentPageStatus]:
        """Return, per DOCUMENT node, how many pages already have generated answers
        vs. the document's total page count (``GET .../tasks/{taskId}/document-pages``)."""
        url = f"{self._base}/tasks/{task_id}/document-pages"
        return [DocumentPageStatus.model_validate(r) for r in self._paginate(url)]

    def get_task_node(self, node_id: str) -> TaskNode:
        """Fetch a single task node by id (``GET .../task-nodes?id=...``)."""
        resp = self._http.get(f"{self._base}/task-nodes", params={"id": node_id})
        if resp.status_code != 200:
            raise GendoxAPIError(f"Failed to fetch task node {node_id}: {resp.status_code}")
        return TaskNode.model_validate(resp.json())

    def _answer_nodes_for_document(self, task_id: str, document_node_id: str) -> list[TaskNode]:
        """Fetch the ANSWER nodes generated for a single DOCUMENT node.

        Uses the same criteria the backend uses internally
        (``nodeValueNodeDocumentId``), so it works for Document Digitization tasks
        where answers link only to the document node (not to a question node).
        """
        url = f"{self._base}/tasks/{task_id}/task-nodes/search"
        body = {"nodeTypeNames": ["ANSWER"], "nodeValueNodeDocumentId": document_node_id}
        return [TaskNode.model_validate(n) for n in self._paginate_post(url, body)]

    def get_missing_pages(self, task_id: str, document_node_id: str) -> list[int]:
        """Return the 1-based page numbers of a document that don't have an answer yet.

        Respects the document node's configured page range (``pageFrom``/``pageTo``)
        when present, otherwise considers the whole document. These are exactly the
        pages :meth:`generate_new` would generate.
        """
        status = {s.taskDocumentNodeId: s for s in self.get_page_status(task_id)}.get(document_node_id)
        total = status.documentPages if status else None

        node = self.get_task_node(document_node_id)
        metadata = (node.nodeValue or {}).get("documentMetadata") or {}
        page_from = metadata.get("pageFrom") or 1
        page_to = metadata.get("pageTo") or total
        if page_to is None:
            raise GendoxAPIError(
                f"Cannot determine total pages for document node {document_node_id}"
            )

        existing = {
            n.page_number
            for n in self._answer_nodes_for_document(task_id, document_node_id)
            if n.page_number is not None
        }
        return [p for p in range(page_from, page_to + 1) if p not in existing]

    def generate_new(
        self,
        task_id: str,
        document_node_id: str,
        on_progress: Optional[Callable] = None,
    ) -> list[int]:
        """Generate answers for a single document, but only for the pages that don't
        have one yet — already-generated pages are left untouched (the backend skips
        them). Returns the list of page numbers that were submitted for generation.

        Use :meth:`regenerate` to redo a document from scratch instead.
        """
        try:
            missing = self.get_missing_pages(task_id, document_node_id)
        except GendoxAPIError as exc:
            # Pre-check is best-effort; the backend skips existing pages regardless.
            logger.warning("Could not pre-compute missing pages: %s", exc)
            missing = None

        if missing == []:
            self._emit(
                on_progress, "generate",
                f"Document node {document_node_id}: all pages already generated - nothing to do",
            )
            return []

        if missing:
            self._emit(on_progress, "generate", f"Generating {len(missing)} missing page(s): {missing}")

        self.execute(
            task_id,
            on_progress,
            document_node_ids=[document_node_id],
            regenerate=False,
        )
        return missing or []

    def regenerate(
        self,
        task_id: str,
        document_node_ids: Optional[list[str]] = None,
        on_progress: Optional[Callable] = None,
    ) -> None:
        """Re-generate answers from scratch: delete existing answers and redo every
        page. Pass ``document_node_ids`` to target specific documents; omit to cover
        the whole task. Use :meth:`generate_new` to only fill in still-missing pages.
        """
        self.execute(
            task_id,
            on_progress,
            document_node_ids=document_node_ids,
            regenerate=True,
        )

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
          - csv:      saves the raw /export-csv response (one .csv per document node)
          - json:     calls /export-csv, parses JSON from each Page column (one .json per page)
          - markdown: calls /export-csv, saves raw Page column content (one .md per page)
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

        results = []
        for node in doc_nodes:
            node_results = self._export_node(task_id, node.id, None, ts, output_folder, formats)
            results.extend(node_results)
            for result in node_results:
                if result.ok:
                    logger.info("Saved: %s", result.path)
                else:
                    logger.warning(
                        "Export failed for node %s (%s): %s", node.id, result.fmt, result.error
                    )

        ok = sum(1 for r in results if r.ok)
        self._emit(on_progress, "export", f"Saved {ok}/{len(results)} file(s) → {output_folder}")
        return results

    def _fetch_export_csv(self, task_id: str, node_id: str) -> tuple[bool, bytes, str]:
        """Call the export-csv endpoint. Returns (ok, content, error_msg)."""
        url = f"{self._base}/tasks/{task_id}/documents/{node_id}/digitization/export-csv"
        resp = self._http.get(url, timeout=60)
        if resp.status_code != 200:
            return False, b"", f"{resp.status_code} {resp.text[:120]}"
        return True, resp.content, ""

    def _export_node(
        self,
        task_id: str,
        node_id: str,
        stem: Optional[str],
        timestamp: str,
        output_folder: Path,
        formats: list[str],
    ) -> list[ExportResult]:
        """Fetch export-csv ONCE for a node and save all requested formats."""
        ok, content, err = self._fetch_export_csv(task_id, node_id)
        if not ok:
            return [ExportResult(node_id=node_id, fmt=f, error=err) for f in formats]

        doc_title, pages = _parse_export_csv(content)
        stem = _stem_from_name(doc_title) or stem or node_id[:8]
        base_name = f"{stem}_{timestamp}"

        results = []

        for fmt in formats:
            try:
                if fmt == "csv":
                    out = output_folder / f"{base_name}.csv"
                    out.write_bytes(content)
                    results.append(ExportResult(node_id=node_id, fmt=fmt, path=str(out)))

                elif fmt == "json":
                    if not pages:
                        results.append(ExportResult(node_id=node_id, fmt=fmt, error="No page data found in CSV response"))
                        continue
                    all_rows: list = []
                    parse_errors = 0
                    for page_num, cell in pages:
                        try:
                            rows = _extract_json_from_message(cell)
                            if isinstance(rows, list):
                                all_rows.extend(rows)
                        except (json.JSONDecodeError, ValueError) as exc:
                            parse_errors += 1
                            logger.warning("Could not parse JSON from page %s of node %s: %s", page_num, node_id, exc)
                    if not all_rows:
                        err = f"JSON parsing failed for all {parse_errors} page(s) - enable debug logging for more details"
                        results.append(ExportResult(node_id=node_id, fmt=fmt, error=err))
                        continue
                    if parse_errors:
                        logger.warning("node %s: %d/%d page(s) failed JSON parsing", node_id, parse_errors, len(pages))
                    out = output_folder / f"{base_name}.json"
                    out.write_text(json.dumps(all_rows, ensure_ascii=False, indent=2), encoding="utf-8")
                    results.append(ExportResult(node_id=node_id, fmt=fmt, path=str(out)))

                elif fmt == "markdown":
                    if not pages:
                        results.append(ExportResult(node_id=node_id, fmt=fmt, error="No page data found in CSV response"))
                        continue
                    combined = "\n\n".join(
                        f"<!-- Page {page_num} -->\n{cell}" for page_num, cell in pages
                    )
                    out = output_folder / f"{base_name}.md"
                    out.write_text(combined, encoding="utf-8")
                    results.append(ExportResult(node_id=node_id, fmt=fmt, path=str(out)))

                else:
                    results.append(ExportResult(node_id=node_id, fmt=fmt, error=f"Unknown format: {fmt}"))

            except Exception as e:
                results.append(ExportResult(node_id=node_id, fmt=fmt, error=str(e)))

        return results

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
        pages_config: Optional[dict[str, dict]] = None,
    ) -> RunSummary:
        """
        Run the full digitization pipeline:
          0. (optional) Cleanup old DOCUMENT nodes
          1. Upload files
          2. Link documents to task
          3. Execute task
          4. Export results

        pages_config maps filename → {"page_from": int, "page_to": int}.
        Files not listed in pages_config are processed with all pages.
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

        # Steps 1–3: Upload → Link → Execute (one round per page-range set)
        if not skip_upload and not state.get("linked"):
            upload_results = self.upload(input_folder, on_progress)
            summary.uploads = upload_results

            # Build doc_ranges: doc_id → list of range dicts (empty dict = all pages)
            doc_ranges: dict[str, list[dict]] = {}
            for r in upload_results:
                if r.ok:
                    if pages_config and r.file in pages_config:
                        val = pages_config[r.file]
                        doc_ranges[r.doc_id] = val if isinstance(val, list) else [val]
                    else:
                        doc_ranges[r.doc_id] = [{}]

            max_rounds = max((len(v) for v in doc_ranges.values()), default=0)
            for round_idx in range(max_rounds):
                round_docs = {
                    doc_id: ranges[round_idx]
                    for doc_id, ranges in doc_ranges.items()
                    if round_idx < len(ranges)
                }
                if not round_docs:
                    break
                if round_idx == 0:
                    self.link(task_id, list(round_docs.keys()), prompt, pages_map=round_docs, on_progress=on_progress)
                else:
                    # UPDATE existing DOCUMENT nodes (preserves ANSWER nodes from previous round)
                    self._update_nodes_pages(task_id, round_docs, prompt, on_progress)
                self.execute(task_id, on_progress)
                if max_rounds > 1:
                    self._emit(on_progress, "execute", f"Round {round_idx + 1}/{max_rounds} complete")

            state["linked"] = True
            state["executed"] = True
            state["uploaded"] = [
                {"file": r.file, "doc_id": r.doc_id} for r in upload_results if r.ok
            ]
            self._save_state(state_file, state)

        # Execute-only path: skip_upload=True or resume after upload
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
