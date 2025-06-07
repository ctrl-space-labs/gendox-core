package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TypeService {

    private TypeRepository typeRepository;

    @Autowired
    public TypeService(TypeRepository typeRepository) {
        this.typeRepository = typeRepository;
    }


    public List<Type> getOrganizationRoles() {
        return typeRepository.findByTypeCategory("ORGANIZATION_ROLE_TYPE");
    }

    public List<Type> getToolExamples() {
        return typeRepository.findByTypeCategory("AI_TOOL_EXAMPLES")
                .stream()
                .sorted(Comparator.comparing(Type::getName, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    //by category and name
    public Type getByCategoryAndName(String category, String name) throws GendoxException {
        return typeRepository.findByTypeCategoryAndName(category, name)
                .orElseThrow(() -> new GendoxException("TYPE_NOT_FOUND", "Type not found with category: " + category + " and name: " + name, HttpStatus.NOT_FOUND));
    }

    //by keyType using getByCategoryAndName
    public Type getKeyTypeByName(String keyTypeName) throws GendoxException {
        return getByCategoryAndName("KEY_TYPE", keyTypeName);
    }

    public Type getOrganizationRolesByName(String roleName) throws GendoxException {
        return typeRepository.findByTypeCategoryAndName("ORGANIZATION_ROLE_TYPE", roleName)
                .orElseThrow(() -> new GendoxException("ROLE_NOT_FOUND", "Role not found with name: " + roleName, HttpStatus.NOT_FOUND));
    }

    public Type getDocumentTypeByName(String documentName) {
        return typeRepository.findByTypeCategoryAndName("DOCUMENT_FIELD_TYPE", documentName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "DOCUMENT_TYPE_NOT_FOUND", "Document field type not found with name: " + documentName));

    }

    public Type getGroupingTypeByName(String groupingName){
        return typeRepository.findByTypeCategoryAndName("GROUPING_STRATEGY_TYPE", groupingName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "GROUPING_STRATEGY_TYPE_NOT_FOUND", "Grouping strategy field type not found with name: " + groupingName));

    }

    public Type getUserTypeByName(String userTypeName){
        return typeRepository.findByTypeCategoryAndName("USER_TYPE", userTypeName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "USER_TYPE_NOT_FOUND", "User field type not found with name: " + userTypeName));

    }

    public Type getEmailInvitationStatusByName(String emailStatusName){
        return typeRepository.findByTypeCategoryAndName("USER_INVITATION_STATUS", emailStatusName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "EMAIL_INVITATION_STATUS_TYPE_NOT_FOUND", "Email invitation status field type not found with name: " + emailStatusName));

    }

    public Type getGlobalApplicationRoleTypeByName(String globalApplicationRoleTypeName){
        return typeRepository.findByTypeCategoryAndName("GLOBAL_APPLICATION_ROLE_TYPE", globalApplicationRoleTypeName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "GLOBAL_APPLICATION_ROLE_TYPE_NOT_FOUND", "Global application role field type not found with name: " + globalApplicationRoleTypeName));

    }


    public Type getDocumentSplitterTypeByName(String splitterName){
        return typeRepository.findByTypeCategoryAndName("DOCUMENT_SPLITTER_TYPE", splitterName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "DOCUMENT_SPLITTER_TYPE_NOT_FOUND", "Document splitter field type not found with name: " + splitterName));

    }


    public Type getIntegrationTypeByName(String integrationName){
        return typeRepository.findByTypeCategoryAndName("INTEGRATION_TYPE", integrationName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "INTEGRATION_TYPE_NOT_FOUND", "Integration field type not found with name: " + integrationName));
    }


    //AUDIT_LOG_TYPES
    public Type getAuditLogTypeByName(String auditLogTypeName){
        return typeRepository.findByTypeCategoryAndName("AUDIT_LOG_TYPE", auditLogTypeName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "AUDIT_LOG_TYPE_NOT_FOUND", "Audit log field type not found with name: " + auditLogTypeName));


    }

    //AI_MODEL_TYPES
    public Type getAiModelTypeByName(String aiModelTypeName){
        return typeRepository.findByTypeCategoryAndName("AI_MODEL_TYPE", aiModelTypeName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "AI_MODEL_TYPE_NOT_FOUND", "AI model field type not found with name: " + aiModelTypeName));

    }

    //File Types
    public Type getFileTypeByName(String fileTypeName){
        return typeRepository.findByTypeCategoryAndName("FILE_TYPE", fileTypeName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "FILE_TYPE_NOT_FOUND", "File field type not found with name: " + fileTypeName));

    }

    //Api Rate Limit Types
    public Type getApiRateLimitTypeByName(String apiRateLimitTypeName){
        return typeRepository.findByTypeCategoryAndName("API_RATE_LIMIT_TYPE", apiRateLimitTypeName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "API_RATE_LIMIT_TYPE_NOT_FOUND", "Api rate limit field type not found with name: " + apiRateLimitTypeName));

    }


    // get all types by type category
    public List<Type> getTypeCategories(String typeCategory) {
        return typeRepository.findByTypeCategory(typeCategory);
    }





}
