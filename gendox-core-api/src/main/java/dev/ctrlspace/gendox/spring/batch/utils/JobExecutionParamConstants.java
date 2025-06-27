package dev.ctrlspace.gendox.spring.batch.utils;

public class JobExecutionParamConstants {

    public static final String SKIP_KNOWN_EMBEDDINGS = "skipKnownEmbeddings";
    public static final String SKIP_UNCHANGED_DOCS = "skipUnchangedDocs";
    public static final String NOW = "now";
    /**
     * Override the default period for the job. This is used to specify a custom time period for the job execution.
     * When set to true, the job will use the provided time period instead of the default one.
     * The execution with overrideDefaultPeriod=true will not be considered in the next automatic job execution
     * to calculate the previous successful run of this job.
     */
    public static final String OVERRIDE_DEFAULT_PERIOD = "overrideDefaultPeriod";
    public static final String JOB_NAME = "jobName";
    public static final String PROJECT_ID = "projectId";
    public static final String ALL_PROJECTS = "ALL_PROJECTS";
    public static final String PROJECT_AUTO_TRAINING = "projectAutoTraining";
    public static final String ORGANIZATION_ID = "organizationId";
    public static final String DOCUMENT_INSTANCE_ID = "documentInstanceId";
    public static final String CREATED_BETWEEN_FROM = "createdBetween.from";
    public static final String CREATED_BETWEEN_TO = "createdBetween.to";
    public static final String UPDATED_BETWEEN_FROM = "updatedBetween.from";
    public static final String UPDATED_BETWEEN_TO = "updatedBetween.to";

}
