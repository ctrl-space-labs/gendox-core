package dev.ctrlspace.gendox.gendoxcoreapi.observations;


import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.common.KeyValue;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationHandler;
import io.micrometer.observation.aop.ObservedAspect;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.stream.StreamSupport;

// Example of plugging in a custom handler that in this case will print a statement before and after all observations take place
@Component
public class LoggingObservationHandler implements ObservationHandler<Observation.Context> {

    private static final Logger log = LoggerFactory.getLogger(LoggingObservationHandler.class);

    @Override
    public void onStart(Observation.Context context) {
        LogValues logValues = getLogValues(context);

        if (logValues == null) return;
        logStart(context, logValues.functionName, logValues.args, logValues.logLevel);
    }

    @Override
    public void onError(Observation.Context context) {
        LogValues logValues = getLogValues(context);

        if (logValues == null) return;
        logError(context, logValues.functionName(), logValues.args(), logValues.logLevel());
    }

    @Override
    public void onStop(Observation.Context context) {
        LogValues logValues = getLogValues(context);

        if (logValues == null) return;
        logStop(context, logValues.functionName, logValues.args, logValues.logLevel);
    }

    @Override
    public boolean supportsContext(Observation.Context context) {
        return true;
    }

    @Nullable
    private LogValues getLogValues(Observation.Context context) {
        if (!(context instanceof ObservedAspect.ObservedAspectContext)) {
            return null;
        }
        //Default values
        String functionName = proceedFunctionName((ObservedAspect.ObservedAspectContext) context);
        String args = "...";
        String logLevel = getTagFromContextByName(context, ObservabilityTags.LOG_LEVEL);

        // populate values from context tags
        if (!"true".equals(getTagFromContextByName(context, ObservabilityTags.LOGGABLE))) {
            return null;
        }

        if ("false".equals(getTagFromContextByName(context, ObservabilityTags.LOG_METHOD_NAME))) {
            functionName = "...";
        }
        if ("true".equals(getTagFromContextByName(context, ObservabilityTags.LOG_ARGS))) {
            args = objectArrayToString(((ObservedAspect.ObservedAspectContext) context).getProceedingJoinPoint().getArgs());
        }
        if (logLevel == null) {
            logLevel = ObservabilityTags.LOG_LEVEL_DEBUG;
        }

        LogValues logValues = new LogValues(functionName, args, logLevel);
        return logValues;
    }

    private record LogValues(String functionName, String args, String logLevel) {
    }



    private static void logInLevel(String logLevel, String s, Observation.Context context, String functionName, String args) {
        // log in the requested log level
        if (logLevel.equals(ObservabilityTags.LOG_LEVEL_INFO)) {
            log.info(s, context.getName(), functionName, args);
        } else if (logLevel.equals(ObservabilityTags.LOG_LEVEL_ERROR)) {
            log.error(s, context.getName(), functionName, args);
        } else if (logLevel.equals(ObservabilityTags.LOG_LEVEL_DEBUG)) {
            log.debug(s, context.getName(), functionName, args);
        } else {
            log.trace(s, context.getName(), functionName, args);
        }
    }
    private static void logStart(Observation.Context context, String functionName, String args, String logLevel) {
        // log in the requested log level
        logInLevel(logLevel, "Before observation for context [{}], method [{}], with args [{}]", context, functionName, args);
    }
    private static void logStop(Observation.Context context, String functionName, String args, String logLevel) {
        // log in the requested log level
        logInLevel(logLevel, "After observation for context [{}], method [{}], with args [{}]", context, functionName, args);
    }
    private static void logError(Observation.Context context, String functionName, String args, String logLevel) {
        if (logLevel.equals(ObservabilityTags.LOG_LEVEL_INFO)) {
            logLevel= ObservabilityTags.LOG_LEVEL_ERROR;
        }
        logInLevel(logLevel, "Error in observation for context [{}], method [{}], with args [{}]", context, functionName, args);
    }

    private String getTagFromContextByName(Observation.Context context, String tagName) {
        return StreamSupport.stream(context.getLowCardinalityKeyValues().spliterator(), false)
                .filter(keyValue -> tagName.equals(keyValue.getKey()))
                .map(KeyValue::getValue)
                .findFirst()
                .orElse(null);
    }

    private String objectArrayToString(Object[] objects) {
        StringBuilder sb = new StringBuilder();
        for (Object object : objects) {
            sb.append(object.toString()).append(",");
        }
        return sb.toString();
    }

    private String proceedFunctionName(ObservedAspect.ObservedAspectContext context) {
        return context.getProceedingJoinPoint().toShortString();
    }


}