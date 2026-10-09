package dev.ctrlspace.gendox.gendoxcoreapi.utils.constants;

import java.util.Set;

public class IntegrationTypesConstants {
    public static final String GIT_INTEGRATION = "GIT_INTEGRATION";
    public static final String DROPBOX_INTEGRATION = "DROPBOX_INTEGRATION";
    public static final String GOOGLE_DRIVE_INTEGRATION = "GOOGLE_DRIVE_INTEGRATION";
    public static final String AWS_S3_INTEGRATION = "AWS_S3_INTEGRATION";
    public static final String API_INTEGRATION = "API_INTEGRATION";
    public static final String WEB_SCRAPE_INTEGRATION = "WEB_SCRAPE_INTEGRATION";

    /**
     * The types something actually runs — the same four the dispatch in IntegrationManager
     * covers. Dropbox and Google Drive have a row in `types` and nothing that processes
     * them, so an integration of those would sit active and never bring anything in: a
     * failure with no symptom, like an integration with no organization.
     */
    public static final Set<String> RUNNABLE_TYPES = Set.of(
            WEB_SCRAPE_INTEGRATION,
            API_INTEGRATION,
            AWS_S3_INTEGRATION,
            GIT_INTEGRATION);
}
