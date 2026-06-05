"""Tests for the gendox CLI."""

from unittest.mock import MagicMock, patch

import pytest

from gendox import _cli
from gendox.exceptions import GendoxAPIError
from gendox.services.digitization.models import RunSummary


REQUIRED_ENV = {
    "GENDOX_TOKEN": "Bearer test-token",
    "GENDOX_API_URL": "https://api.example.test/gendox/api/v1",
    "GENDOX_ORG_ID": "org-abc",
    "GENDOX_PROJECT_ID": "proj-xyz",
    "GENDOX_TASK_ID": "task-123",
}


@pytest.fixture
def empty_summary() -> RunSummary:
    return RunSummary(cleanup_deleted=0, cleanup_failed=[], uploads=[], exports=[])


@pytest.fixture
def patched_run(empty_summary, monkeypatch):
    """Patch GendoxClient + load_dotenv. Yields the mocked run() so tests can assert call args."""
    monkeypatch.setattr(_cli, "load_dotenv", lambda *a, **kw: None)

    fake_client = MagicMock()
    fake_client.digitization.run.return_value = empty_summary
    with patch.object(_cli, "GendoxClient", return_value=fake_client) as mock_cls:
        yield fake_client.digitization.run, mock_cls


class TestRequire:
    def test_returns_override_when_provided(self, monkeypatch):
        monkeypatch.delenv("FOO", raising=False)
        assert _cli._require("FOO", "value") == "value"

    def test_falls_back_to_env(self, monkeypatch):
        monkeypatch.setenv("FOO", "from-env")
        assert _cli._require("FOO") == "from-env"

    def test_override_wins_over_env(self, monkeypatch):
        monkeypatch.setenv("FOO", "from-env")
        assert _cli._require("FOO", "override") == "override"

    def test_strips_whitespace(self, monkeypatch):
        monkeypatch.setenv("FOO", "  spaced  ")
        assert _cli._require("FOO") == "spaced"

    def test_exits_when_missing(self, monkeypatch, capsys):
        monkeypatch.delenv("FOO", raising=False)
        with pytest.raises(SystemExit) as exc:
            _cli._require("FOO")
        assert exc.value.code == 1
        assert "FOO" in capsys.readouterr().out


class TestParser:
    def test_missing_subcommand_exits(self):
        with pytest.raises(SystemExit):
            _cli._build_parser().parse_args([])

    def test_defaults_are_none_or_false(self):
        args = _cli._build_parser().parse_args(["digitize"])
        assert args.service == "digitize"
        assert args.token is None
        assert args.skip_upload is False
        assert args.clean_task is False
        assert args.resume is False
        assert args.verbose is False

    def test_parses_overrides(self):
        args = _cli._build_parser().parse_args([
            "digitize",
            "--token", "tok", "--api-url", "url",
            "--org-id", "o", "--project-id", "p", "--task-id", "t",
            "--export-format", "json", "--skip-upload",
            "--clean-task", "--resume", "-v",
        ])
        assert args.token == "tok"
        assert args.export_format == "json"
        assert args.skip_upload is True
        assert args.clean_task is True
        assert args.resume is True
        assert args.verbose is True

    def test_rejects_unknown_export_format(self):
        with pytest.raises(SystemExit):
            _cli._build_parser().parse_args(["digitize", "--export-format", "yaml"])

    def test_unknown_service_exits(self):
        with pytest.raises(SystemExit):
            _cli._build_parser().parse_args(["unknown-service"])


class TestMain:
    def test_runs_with_env_vars(self, monkeypatch, patched_run):
        for k, v in REQUIRED_ENV.items():
            monkeypatch.setenv(k, v)
        monkeypatch.setattr("sys.argv", ["gendox", "digitize"])
        run, client_cls = patched_run

        _cli.main()

        client_cls.assert_called_once()
        kwargs = client_cls.call_args.kwargs
        assert kwargs["token"] == REQUIRED_ENV["GENDOX_TOKEN"]
        assert kwargs["api_url"] == REQUIRED_ENV["GENDOX_API_URL"]
        run.assert_called_once()
        assert run.call_args.kwargs["task_id"] == REQUIRED_ENV["GENDOX_TASK_ID"]

    def test_cli_args_override_env(self, monkeypatch, patched_run):
        for k, v in REQUIRED_ENV.items():
            monkeypatch.setenv(k, v)
        monkeypatch.setattr("sys.argv", [
            "gendox", "digitize",
            "--token", "override-tok",
            "--task-id", "override-task",
            "--export-format", "markdown",
        ])
        run, client_cls = patched_run

        _cli.main()

        assert client_cls.call_args.kwargs["token"] == "override-tok"
        assert run.call_args.kwargs["task_id"] == "override-task"
        assert run.call_args.kwargs["export_format"] == "markdown"

    def test_export_format_defaults_to_csv(self, monkeypatch, patched_run):
        for k, v in REQUIRED_ENV.items():
            monkeypatch.setenv(k, v)
        monkeypatch.delenv("GENDOX_EXPORT_FORMAT", raising=False)
        monkeypatch.setattr("sys.argv", ["gendox", "digitize"])
        run, _ = patched_run

        _cli.main()

        assert run.call_args.kwargs["export_format"] == "csv"

    def test_boolean_env_vars_parsed(self, monkeypatch, patched_run):
        for k, v in REQUIRED_ENV.items():
            monkeypatch.setenv(k, v)
        monkeypatch.setenv("GENDOX_SKIP_UPLOAD", "true")
        monkeypatch.setenv("GENDOX_CLEAN_TASK", "TRUE")
        monkeypatch.setattr("sys.argv", ["gendox", "digitize"])
        run, _ = patched_run

        _cli.main()

        assert run.call_args.kwargs["skip_upload"] is True
        assert run.call_args.kwargs["clean"] is True

    def test_missing_required_env_exits(self, monkeypatch, patched_run):
        for k in REQUIRED_ENV:
            monkeypatch.delenv(k, raising=False)
        monkeypatch.setattr("sys.argv", ["gendox", "digitize"])

        with pytest.raises(SystemExit) as exc:
            _cli.main()
        assert exc.value.code == 1

    def test_gendox_error_exits_with_code_1(self, monkeypatch, patched_run, capsys):
        for k, v in REQUIRED_ENV.items():
            monkeypatch.setenv(k, v)
        monkeypatch.setattr("sys.argv", ["gendox", "digitize"])
        run, _ = patched_run
        run.side_effect = GendoxAPIError("boom")

        with pytest.raises(SystemExit) as exc:
            _cli.main()
        assert exc.value.code == 1
        assert "boom" in capsys.readouterr().out
