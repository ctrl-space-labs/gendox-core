"""Typed models for the Digitization service.

Divided into two groups:
  - Result models: returned by SDK methods (UploadResult, ExportResult, RunSummary).
  - API response models: parsed from API payloads (Document, TaskNode). They use
    ``extra="allow"`` so the SDK keeps working if the backend adds fields.
"""
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field


# ── Result models ──────────────────────────────────────────────────────────


class UploadResult(BaseModel):
    """Outcome of a single file upload."""
    file: str
    doc_id: Optional[str] = None
    error: Optional[str] = None

    @computed_field
    @property
    def ok(self) -> bool:
        return self.doc_id is not None


class ExportResult(BaseModel):
    """Outcome of a single export (per node, per format)."""
    node_id: str
    fmt: str
    path: Optional[str] = None
    error: Optional[str] = None

    @computed_field
    @property
    def ok(self) -> bool:
        return self.path is not None


class CleanupFailure(BaseModel):
    """A node that could not be deleted during cleanup."""
    node_id: str
    reason: str


class RunSummary(BaseModel):
    """Aggregate outcome of a full pipeline run."""
    cleanup_deleted: int = 0
    cleanup_failed: list[CleanupFailure] = Field(default_factory=list)
    uploads: list[UploadResult] = Field(default_factory=list)
    exports: list[ExportResult] = Field(default_factory=list)

    @property
    def upload_ok(self) -> list[UploadResult]:
        return [u for u in self.uploads if u.ok]

    @property
    def upload_failed(self) -> list[UploadResult]:
        return [u for u in self.uploads if not u.ok]

    @property
    def export_ok(self) -> list[ExportResult]:
        return [e for e in self.exports if e.ok]

    @property
    def export_failed(self) -> list[ExportResult]:
        return [e for e in self.exports if not e.ok]

    @property
    def total_failures(self) -> int:
        return len(self.cleanup_failed) + len(self.upload_failed) + len(self.export_failed)


# ── API response models ───────────────────────────────────────────────────


class Document(BaseModel):
    """A Gendox document as returned by GET /documents/{id}."""
    model_config = ConfigDict(extra="allow")

    id: str
    name: Optional[str] = None
    title: Optional[str] = None
    fileName: Optional[str] = None
    originalFileName: Optional[str] = None

    @property
    def display_name(self) -> str:
        """Best-effort human-readable name (falls back across common fields)."""
        for candidate in (self.name, self.title, self.fileName, self.originalFileName):
            if candidate and candidate.strip():
                return candidate.strip()
        return self.id


class TaskNode(BaseModel):
    """A task node (DOCUMENT, ANSWER, etc.)."""
    model_config = ConfigDict(extra="allow")

    id: str
    documentId: Optional[str] = None
    nodeType: Optional[object] = None  # can be {"name": "DOCUMENT"} or plain str
    nodeValue: Optional[dict] = None

    @property
    def node_type_name(self) -> Optional[str]:
        """Normalize nodeType, which the API returns as either dict or str."""
        nt = self.nodeType
        if isinstance(nt, dict):
            return nt.get("name")
        if isinstance(nt, str):
            return nt
        return None

    @property
    def page_number(self) -> Optional[int]:
        """1-based page number of an ANSWER node (stored as ``nodeValue.order``)."""
        order = (self.nodeValue or {}).get("order")
        return int(order) if order is not None else None


class DocumentPageStatus(BaseModel):
    """Per-document view of how many pages already have generated answers.

    Returned by ``GET .../tasks/{taskId}/document-pages``.
    """
    model_config = ConfigDict(extra="allow")

    taskDocumentNodeId: str
    documentPages: Optional[int] = None   # total pages in the source document
    numberOfNodePages: int = 0            # pages that already have an answer
    maxNodePage: int = 0                  # highest generated page number

    @property
    def missing_count(self) -> Optional[int]:
        """How many pages still lack an answer (None if total is unknown)."""
        if self.documentPages is None:
            return None
        return max(self.documentPages - self.numberOfNodePages, 0)

    @property
    def fully_generated(self) -> bool:
        return self.documentPages is not None and self.numberOfNodePages >= self.documentPages
