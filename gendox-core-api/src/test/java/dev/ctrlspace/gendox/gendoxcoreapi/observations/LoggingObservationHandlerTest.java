package dev.ctrlspace.gendox.gendoxcoreapi.observations;

import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.common.KeyValue;
import io.micrometer.observation.aop.ObservedAspect;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;

class LoggingObservationHandlerTest {
    @Test
    void observationLoggingNeverReadsMethodArgumentsEvenWhenAnnotationRequestsThem() {
        ProceedingJoinPoint invocation = mock(ProceedingJoinPoint.class);
        when(invocation.toShortString()).thenReturn("CompletionService.complete(..)");
        ObservedAspect.ObservedAspectContext context = new ObservedAspect.ObservedAspectContext(invocation);
        context.setName("completion");
        context.addLowCardinalityKeyValue(KeyValue.of(ObservabilityTags.LOGGABLE, "true"));
        context.addLowCardinalityKeyValue(KeyValue.of(ObservabilityTags.LOG_ARGS, "true"));
        LoggingObservationHandler handler = new LoggingObservationHandler();
        handler.onStart(context);
        handler.onError(context);
        handler.onStop(context);
        verify(invocation, never()).getArgs();
    }
}
