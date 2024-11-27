package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentSectionMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SearchResult;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class SearchResultConverter {

    private DocumentService documentService;
    private DocumentSectionService documentSectionService;
    private DocumentSectionMetadataConverter documentSectionMetadataConverter;
    private DocumentInstanceConverter documentInstanceConverter;




    @Autowired
    public SearchResultConverter(
            DocumentService documentService,
            DocumentSectionService documentSectionService,
            DocumentSectionMetadataConverter documentSectionMetadataConverter,
            DocumentInstanceConverter documentInstanceConverter
    ) {
        this.documentService = documentService;
        this.documentSectionService = documentSectionService;
        this.documentSectionMetadataConverter = documentSectionMetadataConverter;
        this.documentInstanceConverter = documentInstanceConverter;
    }

    public DocumentInstanceSectionDTO toDocumentInstanceDTO(SearchResult searchResult) throws GendoxException {


        DocumentInstanceDTO documentInstanceDTO = documentInstanceConverter.toDTO(documentService.getDocumentInstanceById(UUID.fromString(searchResult.getDocumentId())));
        DocumentSectionMetadataDTO metadataDTO = documentSectionMetadataConverter.toDTO(documentSectionService.getMetadataBySectionId(UUID.fromString(searchResult.getDocumentSectionId())));

        DocumentInstanceSectionDTO.DocumentInstanceSectionDTOBuilder builder = DocumentInstanceSectionDTO.builder()
                .id(UUID.fromString(searchResult.getDocumentSectionId()))
                .documentInstanceDTO(documentInstanceDTO)
                .documentSectionMetadata(metadataDTO)
                .sectionValue(searchResult.getText())
                .tokenCount(Double.valueOf(searchResult.getTokens()))
                .documentSectionIsccCode(searchResult.getIscc())
                .documentURL(searchResult.getDocumentURL())
                .signedPermissionOfUseVc(searchResult.getSignedPermissionOfUseVc())
                .ownerName(searchResult.getOwnerName());


        return builder.build();
    }




}
