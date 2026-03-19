INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'ADVANCED_SEARCH',
    $${
          "name": "advanced_search",
          "strict": true,
          "parameters": {
            "type": "object",
            "required": [
              "search_query"
            ],
            "properties": {
              "search_query": {
                "type": "string",
                "description": "The query to be used in the vector search in a document DB."
              }
            },
            "additionalProperties": false
          },
          "description": "Compose a single semantic-search query for the vector store. \n\n▸ INPUTS\n • Focus on the newest context; ignore unrelated earlier turns.\n\n▸ QUERY LENGTH RULES\n  • Let query length scale with the user's current message:\n      − If user says something that doesn't require follow-up search, like 'thanks', return empty string in the search_query.\n      − If the user's turn is brief (≲ 20 words) → expand with synonyms / related phrases.\n      − If the turn is long (≫ 100 words) → condense to the core concepts; ~10–50 % of the user's tokens is fine, it MUST NEVER be more that 4000 characters.\n\n▸ QUERY CONTENT RULES\n  • Preserve the user's main nouns/verbs.\n  • Add 2–4 plausible synonyms or closely related terms for each key concept to improve recall.\n  • Remove filler words, conjunctions, and polite phrases.\n  • Do NOT answer the question or cite documents—only return the query text."
        }$$
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AI_TOOL_EXAMPLES'
      AND name = 'ADVANCED_SEARCH'
);
