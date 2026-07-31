Create a new REST API endpoint for Gendox.

The user wants to create: $ARGUMENTS

Follow the existing layered architecture pattern:

1. **Controller** in `gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/controller/`
   - Use `@RestController` with `@RequestMapping("/gendox/api/v1/...")`
   - Add `@PreAuthorize` for security
   - Use proper HTTP methods and status codes
   - Add request validation

2. **Service** in `gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/services/`
   - Business logic layer
   - Transaction management with `@Transactional`
   - Throw appropriate exceptions from `GendoxException`

3. **Repository** in `gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/repositories/`
   - Extend `JpaRepository`
   - Use QueryDSL for complex queries with `@QuerydslPredicate`

4. **DTOs** in `gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/model/dtos/`
   - Request/Response DTOs separate from entities

5. **Converters** in `gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/converters/`
   - Entity ↔ DTO conversion

6. **Frontend SDK** - Add the corresponding service method in `gendox-frontend/src/gendox-sdk/`

Reference existing controllers and services for patterns.
