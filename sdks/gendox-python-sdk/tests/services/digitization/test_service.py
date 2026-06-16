"""Tests for DigitizationService with mocked HTTP."""
from pathlib import Path

import pytest
import responses

from gendox.exceptions import GendoxAPIError
from gendox.services.digitization.models import TaskNode


TASK_ID = "task-1"


def _node(id_: str, type_: str, doc_id: str | None = None) -> dict:
    """Helper: build a task-node JSON payload (as the API returns it)."""
    node = {"id": id_, "nodeType": {"name": type_}}
    if doc_id:
        node["documentId"] = doc_id
    return node


class TestPaginate:
    @responses.activate
    def test_single_page_short_content(self, service, api_base):
        """A page shorter than page_size ends the iteration (even without ``last``)."""
        responses.add(
            responses.GET,
            f"{api_base}/items",
            json={"content": [{"id": 1}, {"id": 2}]},
        )
        items = list(service._paginate(f"{api_base}/items", page_size=200))
        assert items == [{"id": 1}, {"id": 2}]
        assert len(responses.calls) == 1

    @responses.activate
    def test_multi_page_until_last_flag(self, service, api_base):
        """Pagination continues across pages and stops on ``last: True``."""
        responses.add(
            responses.GET,
            f"{api_base}/items",
            json={"content": [{"id": 1}, {"id": 2}], "last": False},
        )
        responses.add(
            responses.GET,
            f"{api_base}/items",
            json={"content": [{"id": 3}, {"id": 4}], "last": False},
        )
        responses.add(
            responses.GET,
            f"{api_base}/items",
            json={"content": [{"id": 5}], "last": True},
        )
        items = list(service._paginate(f"{api_base}/items", page_size=2))
        assert [i["id"] for i in items] == [1, 2, 3, 4, 5]
        assert len(responses.calls) == 3

    @responses.activate
    def test_multi_page_until_short_page(self, service, api_base):
        """If ``last`` flag missing, a short page still terminates correctly."""
        responses.add(
            responses.GET,
            f"{api_base}/items",
            json={"content": [{"id": 1}, {"id": 2}]},
        )
        responses.add(
            responses.GET,
            f"{api_base}/items",
            json={"content": [{"id": 3}]},  # shorter than page_size → stop
        )
        items = list(service._paginate(f"{api_base}/items", page_size=2))
        assert [i["id"] for i in items] == [1, 2, 3]
        assert len(responses.calls) == 2

    @responses.activate
    def test_appends_page_params_to_existing_query(self, service, api_base):
        responses.add(
            responses.GET,
            f"{api_base}/items",
            json={"content": [], "last": True},
        )
        list(service._paginate(f"{api_base}/items?filter=x", page_size=10))
        assert "filter=x" in responses.calls[0].request.url
        assert "page=0" in responses.calls[0].request.url
        assert "size=10" in responses.calls[0].request.url

    @responses.activate
    def test_non_200_raises(self, service, api_base):
        responses.add(
            responses.GET,
            f"{api_base}/items",
            status=500,
        )
        with pytest.raises(GendoxAPIError, match="Failed to paginate"):
            list(service._paginate(f"{api_base}/items"))

    @responses.activate
    def test_nodes_paginated_across_pages(self, service, api_base):
        """End-to-end: _get_nodes_by_type walks pages and filters by type."""
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={
                "content": [
                    _node("n1", "DOCUMENT"),
                    _node("n2", "ANSWER"),
                ],
                "last": False,
            },
        )
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={
                "content": [_node("n3", "DOCUMENT")],
                "last": True,
            },
        )
        docs = service._get_nodes_by_type(TASK_ID, "DOCUMENT")
        assert [n.id for n in docs] == ["n1", "n3"]
        assert len(responses.calls) == 2


class TestGetNodesByType:
    @responses.activate
    def test_filters_nodes_by_type(self, service, api_base):
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={
                "content": [
                    _node("n1", "DOCUMENT", doc_id="d1"),
                    _node("n2", "ANSWER"),
                    _node("n3", "DOCUMENT", doc_id="d2"),
                ],
                "last": True,
            },
        )
        docs = service._get_nodes_by_type(TASK_ID, "DOCUMENT")
        assert [n.id for n in docs] == ["n1", "n3"]
        assert docs[0].documentId == "d1"
        assert docs[0].node_type_name == "DOCUMENT"

    @responses.activate
    def test_handles_nodeType_as_string(self, service, api_base):
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={"content": [{"id": "n1", "nodeType": "DOCUMENT"}], "last": True},
        )
        assert len(service._get_nodes_by_type(TASK_ID, "DOCUMENT")) == 1

    @responses.activate
    def test_raises_on_non_200(self, service, api_base):
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            status=500,
        )
        with pytest.raises(GendoxAPIError, match="Failed to paginate"):
            service._get_nodes_by_type(TASK_ID, "DOCUMENT")


class TestCleanup:
    @responses.activate
    def test_deletes_all_document_nodes(self, service, api_base):
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={"content": [_node("n1", "DOCUMENT"), _node("n2", "DOCUMENT")]},
        )
        responses.add(responses.DELETE, f"{api_base}/task-nodes/n1", status=204)
        responses.add(responses.DELETE, f"{api_base}/task-nodes/n2", status=204)

        result = service.cleanup(TASK_ID)
        assert result["deleted"] == 2
        assert result["failed"] == []

    @responses.activate
    def test_records_delete_failures(self, service, api_base):
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={"content": [_node("n1", "DOCUMENT"), _node("n2", "DOCUMENT")]},
        )
        responses.add(responses.DELETE, f"{api_base}/task-nodes/n1", status=204)
        responses.add(
            responses.DELETE, f"{api_base}/task-nodes/n2", status=500, body="oops"
        )

        result = service.cleanup(TASK_ID)
        assert result["deleted"] == 1
        assert len(result["failed"]) == 1
        assert result["failed"][0].node_id == "n2"
        assert "500" in result["failed"][0].reason

    @responses.activate
    def test_no_nodes_returns_empty(self, service, api_base):
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={"content": []},
        )
        result = service.cleanup(TASK_ID)
        assert result == {"deleted": 0, "failed": []}


class TestUpload:
    @responses.activate
    def test_uploads_each_supported_file(self, service, api_base, tmp_path: Path):
        (tmp_path / "a.pdf").write_bytes(b"%PDF-1.4 fake")
        (tmp_path / "b.txt").write_text("hello")
        (tmp_path / "c.jpg").write_bytes(b"skip-unsupported")

        responses.add(
            responses.POST,
            f"{api_base}/documents/upload-single",
            json={"id": "doc-1"},
        )
        responses.add(
            responses.POST,
            f"{api_base}/documents/upload-single",
            json={"id": "doc-2"},
        )

        results = service.upload(tmp_path)
        assert len(results) == 2  # .jpg is skipped
        assert all(r.ok for r in results)
        assert {r.doc_id for r in results} == {"doc-1", "doc-2"}

    @responses.activate
    def test_continues_on_individual_failure(self, service, api_base, tmp_path: Path):
        (tmp_path / "ok.pdf").write_bytes(b"pdf")
        (tmp_path / "bad.pdf").write_bytes(b"pdf")

        responses.add(
            responses.POST,
            f"{api_base}/documents/upload-single",
            json={"id": "doc-1"},
        )
        responses.add(
            responses.POST,
            f"{api_base}/documents/upload-single",
            status=500,
            body="boom",
        )

        results = service.upload(tmp_path)
        assert len(results) == 2
        assert sum(1 for r in results if r.ok) == 1
        assert sum(1 for r in results if not r.ok) == 1

    def test_raises_when_no_supported_files(self, service, tmp_path: Path):
        (tmp_path / "unsupported.jpg").write_bytes(b"x")
        with pytest.raises(GendoxAPIError, match="No supported files"):
            service.upload(tmp_path)


class TestLink:
    @responses.activate
    def test_posts_batch_payload(self, service, api_base):
        responses.add(responses.POST, f"{api_base}/task-nodes/batch", status=201)

        service.link(TASK_ID, doc_ids=["d1", "d2"], prompt="extract")

        call = responses.calls[0]
        import json as _json
        body = _json.loads(call.request.body)
        assert len(body) == 2
        assert body[0]["documentId"] == "d1"
        assert body[0]["nodeType"] == "DOCUMENT"
        assert body[0]["nodeValue"]["documentMetadata"]["prompt"] == "extract"

    def test_empty_doc_ids_noop(self, service):
        service.link(TASK_ID, doc_ids=[], prompt="x")



class TestExport:
    @responses.activate
    def test_csv_export_uses_document_name_and_timestamp(
        self, service, api_base, tmp_path: Path
    ):
        csv_body = b"Document Title,col1,col2\ninvoice.pdf,a,b\n"
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={"content": [_node("n1", "DOCUMENT", doc_id="d1")]},
        )
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/documents/n1/digitization/export-csv",
            body=csv_body,
            content_type="text/csv",
        )

        results = service.export(
            TASK_ID, tmp_path, fmt="csv", timestamp="20260424_180000"
        )
        assert len(results) == 1
        assert results[0].ok
        out = tmp_path / "invoice_20260424_180000.csv"
        assert out.exists()
        assert out.read_bytes() == csv_body

    @responses.activate
    def test_no_doc_nodes_returns_empty(self, service, api_base, tmp_path):
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={"content": []},
        )
        assert service.export(TASK_ID, tmp_path, fmt="csv") == []

    def test_invalid_format_raises(self, service, tmp_path):
        with pytest.raises(ValueError, match="Invalid format"):
            service.export(TASK_ID, tmp_path, fmt="xml")


class TestRun:
    """End-to-end test for the full digitization pipeline orchestrated by run()."""

    @responses.activate
    def test_full_pipeline_happy_path(self, service, api_base, tmp_path: Path):
        from unittest.mock import patch

        input_dir = tmp_path / "input"
        input_dir.mkdir()
        (input_dir / "report.pdf").write_bytes(b"%PDF fake")
        output_dir = tmp_path / "output"

        responses.add(
            responses.POST,
            f"{api_base}/documents/upload-single",
            json={"id": "doc-1"},
            status=201,
        )
        responses.add(responses.POST, f"{api_base}/task-nodes/batch", status=201)
        responses.add(
            responses.POST,
            f"{api_base}/tasks/{TASK_ID}/execute",
            status=202,
        )
        responses.add(
            responses.GET,
            f"{api_base}/jobs",
            json={"content": [{"status": "STARTED"}]},
        )
        responses.add(
            responses.GET,
            f"{api_base}/jobs",
            json={"content": [{"status": "COMPLETED"}]},
        )
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={"content": [_node("node-1", "DOCUMENT", doc_id="doc-1")], "last": True},
        )
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/documents/node-1/digitization/export-csv",
            body=b"Document Title,col1,col2\nreport.pdf,val1,val2\n",
            content_type="text/csv",
        )

        with patch("gendox.services.digitization.service.time.sleep"):
            summary = service.run(
                task_id=TASK_ID,
                input_folder=input_dir,
                output_folder=output_dir,
                prompt="extract",
                export_format="csv",
            )

        assert summary.total_failures == 0
        assert len(summary.upload_ok) == 1
        assert summary.upload_ok[0].file == "report.pdf"
        assert len(summary.export_ok) == 1
        csv_files = list(output_dir.glob("report_*.csv"))
        assert len(csv_files) == 1
        assert csv_files[0].read_bytes() == b"Document Title,col1,col2\nreport.pdf,val1,val2\n"
        assert not (output_dir / ".gendox_run_state.json").exists()

        poll_calls = [c for c in responses.calls if "/jobs" in c.request.url]
        assert all("jobName=documentDigitizationJob" in c.request.url for c in poll_calls)

    @responses.activate
    def test_skip_upload_goes_straight_to_execute(self, service, api_base, tmp_path: Path):
        from unittest.mock import patch

        input_dir = tmp_path / "input"
        input_dir.mkdir()
        output_dir = tmp_path / "output"

        responses.add(
            responses.POST, f"{api_base}/tasks/{TASK_ID}/execute", status=202
        )
        responses.add(
            responses.GET,
            f"{api_base}/jobs",
            json={"content": [{"status": "STARTED"}]},
        )
        responses.add(
            responses.GET,
            f"{api_base}/jobs",
            json={"content": [{"status": "COMPLETED"}]},
        )
        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={"content": [], "last": True},
        )

        with patch("gendox.services.digitization.service.time.sleep"):
            summary = service.run(
                task_id=TASK_ID,
                input_folder=input_dir,
                output_folder=output_dir,
                skip_upload=True,
                export_format="csv",
            )

        assert summary.uploads == []
        assert summary.exports == []
        upload_calls = [c for c in responses.calls if "upload-single" in c.request.url]
        assert upload_calls == []

    @responses.activate
    def test_resume_skips_already_completed_steps(self, service, api_base, tmp_path: Path):
        from unittest.mock import patch

        input_dir = tmp_path / "input"
        input_dir.mkdir()
        output_dir = tmp_path / "output"
        output_dir.mkdir()

        import json as _json
        state_file = output_dir / ".gendox_run_state.json"
        state_file.write_text(_json.dumps({"linked": True, "executed": True}))

        responses.add(
            responses.GET,
            f"{api_base}/tasks/{TASK_ID}/task-nodes",
            json={"content": [], "last": True},
        )

        with patch("gendox.services.digitization.service.time.sleep"):
            summary = service.run(
                task_id=TASK_ID,
                input_folder=input_dir,
                output_folder=output_dir,
                resume=True,
                export_format="csv",
            )

        assert summary.uploads == []
        executed_calls = [c for c in responses.calls if "execute" in c.request.url]
        assert executed_calls == []


