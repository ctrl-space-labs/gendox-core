package dev.ctrlspace.gendox.provenAi.utils;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class UniqueIdentifierCodeResponse {

    // Properties common to all unique identifiers
    private String context;
    private String type;
    private String schema;
    private String iscc;
    private String name;
    private String mediaId;
    private String content;
    private String mode;
    private String filename;
    private int filesize;
    private String mediatype;
    private int characters;
    private String metahash;
    private String datahash;
}