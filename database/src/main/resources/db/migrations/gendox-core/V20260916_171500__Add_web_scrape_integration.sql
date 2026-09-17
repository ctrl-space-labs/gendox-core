-- Web scraping integration



-- Seed the type rows first, so the foreign keys of the new table can be satisfied immediately.

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'INTEGRATION_TYPE', 'WEB_SCRAPE_INTEGRATION', 'This is an integration for a web site'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'INTEGRATION_TYPE' AND name = 'WEB_SCRAPE_INTEGRATION'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'CONNECTOR_TYPE', 'WEB_SCRAPE_FIRECRAWL', 'Firecrawl web scraping connector. config payload: { apiKey: string }'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'CONNECTOR_TYPE' AND name = 'WEB_SCRAPE_FIRECRAWL'
);

-- Table web_scrape_pages
CREATE TABLE IF NOT EXISTS gendox_core.web_scrape_pages
(
    id                   UUID          NOT NULL,
    integration_id       UUID          NOT NULL,
    url                  TEXT          NOT NULL,
    title                VARCHAR(1024),
    is_selected          BOOLEAN       NOT NULL DEFAULT FALSE,
    status               TEXT          NOT NULL DEFAULT 'DISCOVERED',
    content_hash         VARCHAR(64),
    document_instance_id UUID,
    discovered_at        TIMESTAMP,
    last_crawled_at      TIMESTAMP,
    last_scraped_at      TIMESTAMP,
    error_message        TEXT,
    created_at           TIMESTAMP,
    updated_at           TIMESTAMP,
    created_by           UUID,
    updated_by           UUID,
    PRIMARY KEY (id),
    CONSTRAINT fk_web_scrape_pages_integration
    FOREIGN KEY (integration_id) REFERENCES gendox_core.integrations (id) ON DELETE CASCADE,
    CONSTRAINT fk_web_scrape_pages_document_instance
    FOREIGN KEY (document_instance_id) REFERENCES gendox_core.document_instance (id) ON DELETE SET NULL,
    CONSTRAINT uq_web_scrape_pages_integration_url UNIQUE (integration_id, url)
    );

COMMENT ON COLUMN gendox_core.web_scrape_pages.status
    IS 'DISCOVERED, SCRAPED, FAILED or REMOVED. Written by the backend, see WebScrapePageStatusConstants.';

CREATE INDEX IF NOT EXISTS idx_web_scrape_pages_integration_selected
    ON gendox_core.web_scrape_pages (integration_id, is_selected);

CREATE INDEX IF NOT EXISTS idx_web_scrape_pages_integration_scraped_at
    ON gendox_core.web_scrape_pages (integration_id, last_scraped_at);



-- Integration columns

ALTER TABLE IF EXISTS gendox_core.integrations
    ADD COLUMN IF NOT EXISTS run_interval_minutes INT;

ALTER TABLE IF EXISTS gendox_core.integrations
    ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP;

ALTER TABLE IF EXISTS gendox_core.integrations
    ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN gendox_core.integrations.run_interval_minutes
    IS 'How often this integration runs, in minutes. NULL means it is not scheduled.';

COMMENT ON COLUMN gendox_core.integrations.last_run_at
    IS 'When this integration last completed a run.';

COMMENT ON COLUMN gendox_core.integrations.config
    IS 'Settings specific to the integration type. Web scraping payload: { provider: string, crawlPageLimit: int }';


-- Subscription plan for web scraping

ALTER TABLE IF EXISTS gendox_core.subscription_plans
    ADD COLUMN IF NOT EXISTS web_scrape_pages_monthly_limit INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN gendox_core.subscription_plans.web_scrape_pages_monthly_limit
    IS 'Max pages scraped per billing period, per seat. 0 means the plan does not include web scraping. 9999 is the Fair Usage Policy for unlimited.';


-- Free Plan: web scraping not included
UPDATE gendox_core.subscription_plans
SET web_scrape_pages_monthly_limit = 0,
    updated_at                     = timezone('UTC', NOW())
WHERE sku = 'gd-free-001';

-- Basic Plan: web scraping not included
UPDATE gendox_core.subscription_plans
SET web_scrape_pages_monthly_limit = 0,
    updated_at                     = timezone('UTC', NOW())
WHERE sku = 'gd-basic-001';

-- Pro Plan: 500 scraped pages per seat, matching the 500 uploaded files
UPDATE gendox_core.subscription_plans
SET web_scrape_pages_monthly_limit = 500,
    updated_at                     = timezone('UTC', NOW())
WHERE sku = 'gd-pro-001';

-- Business Plan: 3x Pro, like every other Business limit
UPDATE gendox_core.subscription_plans
SET web_scrape_pages_monthly_limit = 1500,
    updated_at                     = timezone('UTC', NOW())
WHERE sku = 'gd-business-001';

