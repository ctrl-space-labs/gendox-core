import logging
import time

import requests

from .exceptions import GendoxAPIError, GendoxAuthError

logger = logging.getLogger("gendox.http")

_RETRY_ON_STATUS = {500, 502, 503, 504}


class HttpClient:
    def __init__(self, token: str, max_retries: int = 3, backoff: float = 2.0, timeout: int = 120):
        self._session = requests.Session()
        t = token.strip()
        if not t.startswith("Bearer "):
            t = f"Bearer {t}"
        self._session.headers.update({"Authorization": t, "Accept": "application/json"})
        self._max_retries = max_retries
        self._backoff = backoff
        self._timeout = timeout

    def _request(self, method: str, url: str, **kwargs) -> requests.Response:
        kwargs.setdefault("timeout", self._timeout)
        last_exc = None

        for attempt in range(self._max_retries):
            try:
                resp = self._session.request(method, url, **kwargs)
                logger.debug("%s %s → %s", method.upper(), url, resp.status_code)

                if resp.status_code == 401:
                    raise GendoxAuthError("Unauthorized — check your token")

                if resp.status_code in _RETRY_ON_STATUS and attempt < self._max_retries - 1:
                    delay = self._backoff ** attempt
                    logger.warning(
                        "Got %s, retrying in %.1fs (attempt %d/%d)",
                        resp.status_code, delay, attempt + 1, self._max_retries,
                    )
                    time.sleep(delay)
                    continue

                return resp

            except GendoxAuthError:
                raise
            except requests.RequestException as e:
                last_exc = e
                if attempt < self._max_retries - 1:
                    delay = self._backoff ** attempt
                    logger.warning("Request error: %s, retrying in %.1fs", e, delay)
                    time.sleep(delay)

        raise GendoxAPIError(
            f"Request to {url} failed after {self._max_retries} attempts: {last_exc}"
        )

    def get(self, url: str, **kwargs) -> requests.Response:
        return self._request("GET", url, **kwargs)

    def post(self, url: str, **kwargs) -> requests.Response:
        return self._request("POST", url, **kwargs)

    def put(self, url: str, **kwargs) -> requests.Response:
        return self._request("PUT", url, **kwargs)

    def delete(self, url: str, **kwargs) -> requests.Response:
        return self._request("DELETE", url, **kwargs)
