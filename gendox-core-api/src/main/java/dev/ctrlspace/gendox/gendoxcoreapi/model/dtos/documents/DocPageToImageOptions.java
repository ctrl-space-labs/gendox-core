package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import lombok.*;
import org.springframework.http.HttpStatus;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class DocPageToImageOptions {

    @Builder.Default
    private int pageFrom = 0;          // inclusive, 0-based

    @Builder.Default
    private Integer pageTo = null;     // exclusive; if null -> totalPages

    @Builder.Default
    private int minSide = 768;


    private Float renderDPI;           // null => use minSide/scale logic

    @Builder.Default
    private float imageContrast = 1.15f;

    @Builder.Default
    private float imageBrightness = -10f;

    @Builder.Default
    private float jpegQ = 0.90f;

    public DocPageToImageOptions applyDefaults(int totalPages) {
        DocPageToImageOptionsBuilder b = this.toBuilder();

        if (pageTo == null) {
            b.pageTo(totalPages-1); // inclusive
        }

        DocPageToImageOptions withDefaults = b.build();

        if (withDefaults.pageFrom < 0 || withDefaults.pageTo < 0 || withDefaults.pageFrom > withDefaults.pageTo || withDefaults.pageTo > totalPages) {
            throw new IllegalArgumentException(
                    "Invalid page range: from(inclusive)=" + withDefaults.pageFrom + " to(inclusive)=" + withDefaults.pageTo + " total=" + totalPages);
        }

        if (withDefaults.minSide <= 0) {
            throw new IllegalArgumentException("minSide must be > 0");
        }

        if (withDefaults.jpegQ < 0f || withDefaults.jpegQ > 1f) {
            throw new IllegalArgumentException("jpegQ must be in [0,1]");
        }

        return withDefaults;
    }


}
