package dev.ctrlspace.gendox.gendoxcoreapi.utils;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DurationUtils {

    private static final Pattern DURATION_PATTERN = Pattern.compile("(\\d+)([a-zA-Z]+)");

    public Long convertToMilliseconds(String duration) {
        long totalMilliseconds = 0;
        Matcher matcher = DURATION_PATTERN.matcher(duration);
        while (matcher.find()) {
            long value = Long.parseLong(matcher.group(1)); // Use long for whole numbers.
            String unit = matcher.group(2);

            if ("ms".equals(unit)) { // milliseconds
                totalMilliseconds += value;
            } else if ("s".equals(unit)) { // seconds
                totalMilliseconds += value * 1_000;
            } else if ("m".equals(unit)) { // minutes
                totalMilliseconds += value * 60_000;
            } else if ("h".equals(unit)) { // hours
                totalMilliseconds += value * 3_600_000;
            } else if ("d".equals(unit)) { // days
                totalMilliseconds += value * 86_400_000;
            } else if ("w".equals(unit)) { // weeks
                totalMilliseconds += value * 604_800_000;
            }
        }

        return totalMilliseconds; // Correctly placed outside the loop.
    }
}