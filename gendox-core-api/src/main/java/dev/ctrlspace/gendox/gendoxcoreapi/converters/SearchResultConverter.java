package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentSectionMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SearchResult;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class SearchResultConverter {

    private DocumentService documentService;

    private DocumentOnlyConverter documentOnlyConverter;

    private DocumentSectionService documentSectionService;

    private DocumentSectionMetadataConverter documentSectionMetadataConverter;




    @Autowired
    public SearchResultConverter(
            DocumentService documentService,
            DocumentOnlyConverter documentOnlyConverter,
            DocumentSectionService documentSectionService,
            DocumentSectionMetadataConverter documentSectionMetadataConverter

    ) {
        this.documentService = documentService;
        this.documentOnlyConverter = documentOnlyConverter;
        this.documentSectionService = documentSectionService;
        this.documentSectionMetadataConverter = documentSectionMetadataConverter;

    }

    public DocumentInstanceSectionDTO toDocumentInstanceDTO(SearchResult searchResult) throws GendoxException {


        DocumentDTO documentDTO = documentOnlyConverter.toDTO(documentService.getDocumentInstanceById(UUID.fromString(searchResult.getDocumentId())));
        DocumentSectionMetadataDTO metadataDTO = documentSectionMetadataConverter.toDTO(documentSectionService.getMetadataById(UUID.fromString(searchResult.getDocumentSectionId())));

        DocumentInstanceSectionDTO.DocumentInstanceSectionDTOBuilder builder = DocumentInstanceSectionDTO.builder()
                .id(UUID.fromString(searchResult.getDocumentSectionId()))
                .documentDTO(documentDTO)
                .documentSectionMetadata(metadataDTO)
                .sectionValue(searchResult.getText())
                .tokenCount(Double.valueOf(searchResult.getTokens()))
                .documentSectionIsccCode(searchResult.getIscc())
                .documentURL(searchResult.getDocumentURL())
                .ownerName(searchResult.getOwnerName());

        return builder.build();
    }




}
