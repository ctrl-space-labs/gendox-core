package dev.ctrlspace.gendox.gendoxcoreapi.utils.constants;

/**
 * Constants for the tags used in the Observability framework
 * These tags are used to control the behavior of the Observability LoggingObservationHandler
 * ex.
 * ```
 * .lowCardinalityKeyValues = {
 *      ObservabilityTags.LOGGABLE, "true",
 *      ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
 *      ObservabilityTags.LOG_METHOD_NAME, "true",
 *      ObservabilityTags.LOG_ARGS, "true"
 * }
 * ```
 */
public class ObservabilityTags {
    public static final String LOGGABLE = "LOGGABLE";
    public static final String LOG_LEVEL = "LOG_LEVEL";
    public static final String LOG_METHOD_NAME = "LOG_METHOD_NAME";
    public static final String LOG_ARGS = "LOG_ARGS";



    public static final String LOG_LEVEL_INFO = "LOG_LEVEL_INFO";
    public static final String LOG_LEVEL_ERROR = "LOG_LEVEL_ERROR";
    public static final String LOG_LEVEL_DEBUG = "LOG_LEVEL_DEBUG";
    public static final String LOG_LEVEL_TRACE = "LOG_LEVEL_TRACE";
}
