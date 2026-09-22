package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Splits Gemini's inline {@code <thought>...</thought>} block out of the answer text.
 * Gemini's compat layer has no reasoning field; without this the transcript renders as the answer.
 */
public final class InlineReasoningParser {

    /** Reluctant, so a reply that mentions the tag cannot swallow the answer. */
    private static final Pattern THOUGHT_BLOCK =
            Pattern.compile("<thought>(.*?)</thought>", Pattern.DOTALL | Pattern.CASE_INSENSITIVE);

    private InlineReasoningParser() {
    }

    /**
     * @param reasoning the reasoning summary, or {@code null} when the content had none
     * @param content   the answer with every reasoning block removed
     */
    public record Split(String reasoning, String content) {
    }

    /** Returns content unchanged with null reasoning when there is no block. */
    public static Split split(String rawContent) {
        if (rawContent == null || rawContent.isEmpty()) {
            return new Split(null, rawContent);
        }

        Matcher matcher = THOUGHT_BLOCK.matcher(rawContent);
        StringBuilder reasoning = new StringBuilder();
        StringBuilder answer = new StringBuilder();
        int lastEnd = 0;

        // Models interleave thinking with tool calls, so collect every block.
        while (matcher.find()) {
            answer.append(rawContent, lastEnd, matcher.start());
            if (!reasoning.isEmpty()) {
                reasoning.append("\n\n");
            }
            reasoning.append(matcher.group(1).trim());
            lastEnd = matcher.end();
        }

        if (lastEnd == 0) {
            return new Split(null, rawContent);
        }

        answer.append(rawContent.substring(lastEnd));

        String cleanedAnswer = answer.toString().trim();
        String collectedReasoning = reasoning.toString().trim();

        return new Split(
                collectedReasoning.isEmpty() ? null : collectedReasoning,
                cleanedAnswer.isEmpty() ? null : cleanedAnswer);
    }
}
