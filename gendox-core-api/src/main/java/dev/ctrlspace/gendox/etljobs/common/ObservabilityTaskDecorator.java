package dev.ctrlspace.gendox.etljobs.common;

import org.slf4j.MDC;
import org.springframework.core.task.TaskDecorator;

import java.util.Map;

public class ObservabilityTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        Map<String, String> prevMDC = MDC.getCopyOfContextMap();
        return () -> {
            try {
                if (prevMDC != null ) {
                    MDC.setContextMap(prevMDC);
                }
                runnable.run();
            } finally {
                MDC.clear();
            }
        };
    }
}