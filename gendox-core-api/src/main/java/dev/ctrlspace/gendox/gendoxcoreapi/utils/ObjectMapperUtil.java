package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

/**
 * Sets the global, Spring-configured instance, to be used by non-Spring components.
 */
@Component
public class ObjectMapperUtil {
    public static ObjectMapper MAPPER;

    public ObjectMapperUtil(ObjectMapper mapper) {
        ObjectMapperUtil.MAPPER = mapper;
    }
}
