package dev.ctrlspace.gendox.gendoxcoreapi.utils.constants;

public class WebScrapeConstants {

    /**
     * Keys in organization_connectors.config and integrations.config, and the schedule's floor
     */
    public static class Config {
        // organization_connectors.config
        public static final String API_KEY = "apiKey";

        // integrations.config
        public static final String PROVIDER = "provider";
        public static final String CRAWL_PAGE_LIMIT = "crawlPageLimit";

        public static final int MIN_RUN_INTERVAL_MINUTES = 1440;
    }

    /**
     * web_scrape_pages.status
     */
    public static class PageStatus {
        public static final String DISCOVERED = "DISCOVERED";
        public static final String SCRAPED = "SCRAPED";
        public static final String FAILED = "FAILED";
        public static final String REMOVED = "REMOVED";
    }

    /**
     * Error codes that the code branches on, not only reports
     */
    public static class ErrorCodes {
        // the provider is limiting our requests; nothing is wrong with the page, so it is read on the next run
        public static final String RATE_LIMITED = "WEB_SCRAPE_RATE_LIMITED";

        // the page is gone from the site (404 / 410), so it is marked REMOVED rather than FAILED
        public static final String PAGE_NOT_FOUND = "WEB_SCRAPE_PAGE_NOT_FOUND";

        // the page is gone from the site (410), so it is marked REMOVED rather than FAILED
        public static final String PAGE_GONE = "WEB_SCRAPE_PAGE_GONE";
        // the page is still on the site, but it has no content (empty markdown), so it is marked FAILED rather than REMOVED
        public static final String PAGE_FAILED = "WEB_SCRAPE_PAGE_FAILED";


    }
}