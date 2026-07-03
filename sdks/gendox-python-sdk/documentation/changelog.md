# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `DigitizationService.execute()` now accepts `document_node_ids` (scope generation
  to specific DOCUMENT nodes) and `regenerate` (default `False` = only generate pages
  that don't have an answer yet; `True` = redo every page from scratch).
- `DigitizationService.generate_new(task_id, document_node_id)` — generate only the
  still-missing pages of a single document (already-generated pages are skipped by the
  backend). Returns the page numbers submitted for generation.
- `DigitizationService.regenerate()` — re-generate answers from scratch for the whole
  task or specific documents.
- `DigitizationService.get_page_status()` — per-document generated-vs-total page counts.
- `DigitizationService.get_missing_pages(task_id, document_node_id)` — exact 1-based
  page numbers that still need generation.
- `DigitizationService.list_document_nodes()`, `list_answer_nodes()` and
  `get_task_node()` helpers to discover node ids.

## [0.1.0] - 2026-04-25

### Added
- Initial release of the Gendox Python SDK.
- `GendoxClient` entry point.
- `DigitizationService` with full upload → link → train → execute → export pipeline.
- `gendox digitize` CLI with `.env` and flag-based configuration.
- `HttpClient` with retry/backoff and typed error hierarchy
  (`GendoxAPIError`, `GendoxAuthError`, `GendoxTimeoutError`).
- Pydantic v2 models for API responses and run summaries.
- Test suite with mocked HTTP (89% coverage).
- `gendox-workspace/` standalone workspace folder for end users.
- `find_dotenv(usecwd=True)` fix — CLI now reads `.env` from the user's working directory.

[Unreleased]: https://github.com/ctrl-space-labs/gendox-sdk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ctrl-space-labs/gendox-sdk/releases/tag/v0.1.0
