"""Shared test fixtures."""
import sys
from pathlib import Path

# Make the SDK importable without `pip install -e .`
SDK_ROOT = Path(__file__).resolve().parent.parent
if str(SDK_ROOT) not in sys.path:
    sys.path.insert(0, str(SDK_ROOT))

import pytest

from gendox._http import HttpClient
from gendox.services.digitization import DigitizationService


API_URL = "https://api.example.test/gendox/api/v1"
ORG_ID = "org-abc"
PROJECT_ID = "proj-xyz"
TOKEN = "Bearer test-token"


@pytest.fixture
def http_client() -> HttpClient:
    # Zero backoff so retry tests don't sleep.
    return HttpClient(token=TOKEN, max_retries=3, backoff=1.0, timeout=5)


@pytest.fixture
def service(http_client: HttpClient) -> DigitizationService:
    return DigitizationService(http_client, API_URL, ORG_ID, PROJECT_ID)


@pytest.fixture
def api_base() -> str:
    return f"{API_URL}/organizations/{ORG_ID}/projects/{PROJECT_ID}"
