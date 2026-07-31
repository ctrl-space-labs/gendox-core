Create a new AI model provider adapter for Gendox.

The user wants to integrate: $ARGUMENTS

Follow the existing adapter implementation pattern:

1. **Create DTOs** in `gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/ai/engine/model/dtos/<provider>/`
   - Request/Response classes matching the provider's API format

2. **Create the service adapter** in `gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/ai/engine/services/<provider>/aiengine/aiengine/`
   - Implement `AiModelApiAdapterService` interface
   - Support the relevant methods: `askCompletion`, `askEmbedding`, `askModeration`, `askRerank`
   - Use `RestTemplate` for HTTP calls
   - Add `@Component` with `@Qualifier` annotation

3. **Create a response converter** in `gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/ai/engine/converters/`
   - Convert provider-specific response to generic `CompletionResponse`

4. **Create config constants** in `gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/ai/engine/utils/constants/`

5. **Create a database migration** to insert the provider and models into `ai_model_providers` and `ai_models` tables

6. **Reference existing adapters** for patterns:
   - `OpenAiServiceAdapter.java` - most complete implementation (with tool use)
   - `AnthropicAiServiceAdapter.java` - simpler implementation
