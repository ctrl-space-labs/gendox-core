"""Tests for HttpClient — auth, retry, backoff."""
from unittest.mock import patch

import pytest
import responses

from gendox._http import HttpClient
from gendox.exceptions import GendoxAPIError, GendoxAuthError


URL = "https://api.example.test/endpoint"


@pytest.fixture(autouse=True)
def no_sleep():
    """Patch time.sleep so retry tests are instant."""
    with patch("gendox._http.time.sleep"):
        yield


def _client(**kwargs) -> HttpClient:
    return HttpClient(token="test-token", max_retries=3, backoff=1.0, timeout=5, **kwargs)


class TestAuth:
    def test_adds_bearer_prefix_if_missing(self):
        c = HttpClient(token="abc123")
        assert c._session.headers["Authorization"] == "Bearer abc123"

    def test_keeps_bearer_prefix_if_present(self):
        c = HttpClient(token="Bearer abc123")
        assert c._session.headers["Authorization"] == "Bearer abc123"

    def test_strips_whitespace(self):
        c = HttpClient(token="  abc123  ")
        assert c._session.headers["Authorization"] == "Bearer abc123"

    @responses.activate
    def test_401_raises_auth_error(self):
        responses.add(responses.GET, URL, status=401)
        with pytest.raises(GendoxAuthError, match="Unauthorized"):
            _client().get(URL)


class TestRetry:
    @responses.activate
    def test_retries_on_500_then_succeeds(self):
        responses.add(responses.GET, URL, status=500)
        responses.add(responses.GET, URL, status=500)
        responses.add(responses.GET, URL, status=200, json={"ok": True})

        resp = _client().get(URL)
        assert resp.status_code == 200
        assert len(responses.calls) == 3

    @responses.activate
    def test_does_not_retry_on_400(self):
        responses.add(responses.GET, URL, status=400, json={"error": "bad"})

        resp = _client().get(URL)
        assert resp.status_code == 400
        assert len(responses.calls) == 1  # no retries

    @responses.activate
    def test_does_not_retry_on_404(self):
        responses.add(responses.GET, URL, status=404)

        resp = _client().get(URL)
        assert resp.status_code == 404
        assert len(responses.calls) == 1

    @responses.activate
    def test_gives_up_after_max_retries(self):
        for _ in range(5):
            responses.add(responses.GET, URL, status=503)

        resp = _client().get(URL)
        # After max_retries attempts still 503, returns the final response (not an exception).
        assert resp.status_code == 503
        assert len(responses.calls) == 3

    @responses.activate
    def test_network_error_retried_then_raises(self):
        import requests as rq
        responses.add(responses.GET, URL, body=rq.ConnectionError("network down"))
        responses.add(responses.GET, URL, body=rq.ConnectionError("network down"))
        responses.add(responses.GET, URL, body=rq.ConnectionError("network down"))

        with pytest.raises(GendoxAPIError, match="failed after 3 attempts"):
            _client().get(URL)


class TestHttpMethods:
    @responses.activate
    def test_get_post_delete_dispatch(self):
        responses.add(responses.GET, URL, json={"m": "get"})
        responses.add(responses.POST, URL, json={"m": "post"})
        responses.add(responses.DELETE, URL, status=204)

        c = _client()
        assert c.get(URL).json()["m"] == "get"
        assert c.post(URL, json={}).json()["m"] == "post"
        assert c.delete(URL).status_code == 204
