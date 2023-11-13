package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

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


    public Type getOrganizationRolesByName(String roleName) {
        return typeRepository.findByTypeCategoryAndName("ORGANIZATION_ROLE_TYPE", roleName)
                .orElseThrow(() -> new GendoxRuntimeException(HttpStatus.NOT_FOUND, "ROLE_NOT_FOUND", "Role not found with name: " + roleName));
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




    /**
     * Multiple handy service methods can go here like
     * getOrganizationRoles()
     * getOrganizationPermissions()
     * getDocumentFieldTypes()
     * ...
     */
}
