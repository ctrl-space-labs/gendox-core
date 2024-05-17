package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.provenAi.utils.IsccCodeResponse;
import dev.ctrlspace.gendox.provenAi.utils.UniqueIdentifierCodeResponse;

public class IsccCodeResponseConverter {

    public UniqueIdentifierCodeResponse toUniqueIdentifierCodeResponse(IsccCodeResponse isccCodeResponse) {
        UniqueIdentifierCodeResponse uniqueIdentifierCodeResponse = UniqueIdentifierCodeResponse.builder()
                .context(isccCodeResponse.getContext())
                .type(isccCodeResponse.getType())
                .schema(isccCodeResponse.getSchema())
                .iscc(isccCodeResponse.getIscc())
                .name(isccCodeResponse.getName())
                .mediaId(isccCodeResponse.getMediaId())
                .content(isccCodeResponse.getContent())
                .mode(isccCodeResponse.getMode())
                .filename(isccCodeResponse.getFilename())
                .filesize(isccCodeResponse.getFilesize())
                .mediatype(isccCodeResponse.getMediatype())
                .characters(isccCodeResponse.getCharacters())
                .metahash(isccCodeResponse.getMetahash())
                .datahash(isccCodeResponse.getDatahash())

                .build();

        return uniqueIdentifierCodeResponse;
    }
}
