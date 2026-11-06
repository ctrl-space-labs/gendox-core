-- Why an integration's last run failed, for every integration type
ALTER TABLE gendox_core.integrations
    ADD COLUMN IF NOT EXISTS last_run_error TEXT;

COMMENT ON COLUMN gendox_core.integrations.last_run_error
    IS 'Why the last run failed, or null when it succeeded. Written with last_run_at on every run, scheduled or manual, for every integration type.';

-- When a web page last failed; last_scraped_at stays the last successful read, which the monthly budget counts
ALTER TABLE gendox_core.web_scrape_pages
    ADD COLUMN IF NOT EXISTS last_failed_at TIMESTAMP;

COMMENT ON COLUMN gendox_core.web_scrape_pages.last_failed_at
    IS 'When the page last failed to be read, or null after it is read. last_scraped_at keeps the last successful read.';