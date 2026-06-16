from ._http import HttpClient
from .services.digitization import DigitizationService


class GendoxClient:
    """
    Entry point for the Gendox SDK.

    Example::

        from gendox import GendoxClient

        client = GendoxClient(
            token="Bearer eyJ...",
            api_url="https://dev-app.gendox.dev/gendox/api/v1",
            org_id="9de504d4-...",
            project_id="32ae0a6b-...",
        )

        summary = client.digitization.run(
            task_id="aa4fc298-...",
            input_folder=Path("./input"),
            output_folder=Path("./output"),
            prompt="Extract the table...",
            clean=True,
            export_format="all",
        )
    """

    def __init__(
        self,
        token: str,
        api_url: str,
        org_id: str,
        project_id: str,
        max_retries: int = 3,
        backoff: float = 2.0,
    ):
        self._http = HttpClient(token, max_retries=max_retries, backoff=backoff)
        self.digitization = DigitizationService(
            self._http, api_url.rstrip("/"), org_id, project_id
        )
