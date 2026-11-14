/**
 * The models an agent uses in the LLM tests (tests/llm), per tier and provider. Each
 * provider of the chosen tier becomes a Playwright project of its own, `llm-<provider>`,
 * so the providers run in parallel and a report names the adapter that broke.
 *
 * Only the LLM tests use these. Every other test, on every target, uses the mock models.
 *
 * Names are the `model` column of the catalog (GET .../ai-models). A provider without an
 * embedding API is paired with the default embedding model. When a deployed environment
 * lacks a model, the test fails and lists what the environment offers.
 *
 * E2E_PROVIDERS=openai,anthropic limits a run to some providers.
 */
const tiers = {
    mock: {
        mock: { completion: 'mock-gemini-2.0-flash', embedding: 'mock-gemini-embedding' },
    },
    small: {
        openai: { completion: 'gpt-6-luna', embedding: 'text-embedding-3-small' },
        anthropic: { completion: 'claude-haiku-4-5', embedding: 'voyage-4-lite' },
        gemini: { completion: 'gemini-3.5-flash-lite', embedding: 'gemini-embedding-001' },
        mistral: { completion: 'mistral-small-latest', embedding: 'mistral-embed' },
        cohere: { completion: 'command-r7b-12-2024', embedding: 'embed-v4.0' },
        groq: { completion: 'llama-3.3-70b-versatile', embedding: 'voyage-4-lite' },
        xai: { completion: 'grok-4.3', embedding: 'voyage-4-lite' },
        nebius: { completion: 'Qwen/Qwen3-30B-A3B-Instruct-2507', embedding: 'voyage-4-lite' },
    },
    large: {
        openai: { completion: 'gpt-6-sol', embedding: 'text-embedding-3-large' },
        anthropic: { completion: 'claude-opus-5', embedding: 'voyage-3-large' },
        gemini: { completion: 'gemini-3.1-pro-preview', embedding: 'gemini-embedding-2' },
        mistral: { completion: 'mistral-medium-3.5', embedding: 'mistral-embed' },
        cohere: { completion: 'command-a-03-2025', embedding: 'embed-v4.0' },
        xai: { completion: 'grok-4.6', embedding: 'voyage-3-large' },
        nebius: { completion: 'deepseek-ai/DeepSeek-V4-Pro', embedding: 'voyage-3-large' },
    },
};

// Requests to the models a run may send, counted per chat message or task run. The
// default keeps a forgotten loop from spending; E2E_MAX_LLM_REQUESTS raises it.
const defaultBudget = { mock: Infinity, small: 120, large: 40 };

const profilesFor = (tier) => {
    const all = tiers[tier];
    const wanted = (process.env.E2E_PROVIDERS || '').split(',').map(name => name.trim().toLowerCase()).filter(Boolean);
    if (tier === 'mock' || wanted.length === 0) {
        return Object.entries(all).map(([provider, models]) => ({ provider, ...models }));
    }
    const unknown = wanted.filter(name => !all[name]);
    if (unknown.length) {
        throw new Error(`E2E_PROVIDERS: no ${unknown.join(', ')} in the ${tier} tier. It has ${Object.keys(all).join(', ')}.`);
    }
    return wanted.map(provider => ({ provider, ...all[provider] }));
};

const budgetFor = (tier) => (process.env.E2E_MAX_LLM_REQUESTS ? Number(process.env.E2E_MAX_LLM_REQUESTS) : defaultBudget[tier]);

module.exports = { tiers, mock: { provider: 'mock', ...tiers.mock.mock }, profilesFor, budgetFor };
