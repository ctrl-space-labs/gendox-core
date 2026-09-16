package dev.ctrlspace.gendox.gendoxcoreapi.utils.constants;

import java.util.List;

public class FirecrawlConfig {

    public static final String PROVIDER_NAME = "FIRECRAWL";
    public static final String MAP_PATH = "/map";
    public static final String SCRAPE_PATH = "/scrape";
    public static final String CRAWL_PATH = "/crawl";
    public static final String FORMAT_MARKDOWN = "markdown";
    public static final String FORMAT_LINKS = "links";
    public static final String CRAWL_STATUS_COMPLETED = "completed";
    public static final String CRAWL_STATUS_FAILED = "failed";
    public static final long CRAWL_POLL_INTERVAL_MILLIS = 3000L;
    public static final long CRAWL_TIMEOUT_MILLIS = 30 * 60 * 1000L;
    public static final List<String> NON_PAGE_EXTENSIONS =
            List.of(".xml", ".json", ".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".zip");


}
