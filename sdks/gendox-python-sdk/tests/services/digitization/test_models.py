"""Tests for Pydantic models in gendox.services.digitization.models."""
import pytest
from pydantic import ValidationError

from gendox.services.digitization.models import (
    CleanupFailure,
    Document,
    ExportResult,
    RunSummary,
    TaskNode,
    UploadResult,
)


class TestUploadResult:
    def test_ok_when_doc_id_present(self):
        r = UploadResult(file="a.pdf", doc_id="123")
        assert r.ok is True
        assert r.error is None

    def test_not_ok_when_only_error(self):
        r = UploadResult(file="a.pdf", error="boom")
        assert r.ok is False
        assert r.doc_id is None

    def test_file_is_required(self):
        with pytest.raises(ValidationError):
            UploadResult()


class TestExportResult:
    def test_ok_when_path_present(self):
        r = ExportResult(node_id="n1", fmt="csv", path="/tmp/out.csv")
        assert r.ok is True

    def test_not_ok_when_no_path(self):
        r = ExportResult(node_id="n1", fmt="csv", error="fail")
        assert r.ok is False


class TestRunSummary:
    def test_defaults(self):
        s = RunSummary()
        assert s.cleanup_deleted == 0
        assert s.cleanup_failed == []
        assert s.uploads == []
        assert s.exports == []
        assert s.total_failures == 0

    def test_aggregates_failures(self):
        s = RunSummary(
            cleanup_failed=[CleanupFailure(node_id="n1", reason="500")],
            uploads=[
                UploadResult(file="a.pdf", doc_id="1"),
                UploadResult(file="b.pdf", error="x"),
            ],
            exports=[
                ExportResult(node_id="n1", fmt="csv", path="/x"),
                ExportResult(node_id="n2", fmt="csv", error="y"),
            ],
        )
        assert len(s.upload_ok) == 1
        assert len(s.upload_failed) == 1
        assert len(s.export_ok) == 1
        assert len(s.export_failed) == 1
        assert s.total_failures == 3  # 1 cleanup + 1 upload + 1 export


class TestDocument:
    def test_display_name_prefers_name(self):
        d = Document(id="1", name="report.pdf", fileName="report_raw.pdf")
        assert d.display_name == "report.pdf"

    def test_display_name_falls_back(self):
        d = Document(id="1", fileName="raw.pdf")
        assert d.display_name == "raw.pdf"

    def test_display_name_fallback_to_id(self):
        d = Document(id="abcd")
        assert d.display_name == "abcd"

    def test_extra_fields_allowed(self):
        Document(id="1", name="x.pdf", brandNewField="ignored")

    def test_id_required(self):
        with pytest.raises(ValidationError):
            Document(name="x.pdf")


class TestTaskNode:
    def test_node_type_from_dict(self):
        n = TaskNode(id="n1", nodeType={"name": "DOCUMENT"})
        assert n.node_type_name == "DOCUMENT"

    def test_node_type_from_string(self):
        n = TaskNode(id="n1", nodeType="ANSWER")
        assert n.node_type_name == "ANSWER"

    def test_node_type_none(self):
        n = TaskNode(id="n1")
        assert n.node_type_name is None
