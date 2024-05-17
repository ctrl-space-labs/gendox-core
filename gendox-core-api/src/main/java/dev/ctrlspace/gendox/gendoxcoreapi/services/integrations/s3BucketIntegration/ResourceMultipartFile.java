package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;

/**
 * Custom implementation of the Spring MultipartFile interface that wraps a byte array as file content.
 */
public class ResourceMultipartFile implements MultipartFile {

    private final byte[] content;
    private final String name;
    private final String contentType;

    /**
     * Constructs a ResourceMultipartFile with the given content, name, and content type.
     *
     * @param content     The byte array content of the file.
     * @param name        The name of the file.
     * @param contentType The content type of the file.
     */
    public ResourceMultipartFile(byte[] content, String name, String contentType) {
        this.content = content;
        this.name = name;
        this.contentType = contentType;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public String getOriginalFilename() {
        return name;
    }

    @Override
    public String getContentType() {
        return contentType;
    }

    @Override
    public boolean isEmpty() {
        return content == null || content.length == 0;
    }

    @Override
    public long getSize() {
        return content.length;
    }

    @Override
    public byte[] getBytes() throws IOException {
        return content;
    }

    @Override
    public InputStream getInputStream() throws IOException {
        return new ByteArrayResource(content).getInputStream();
    }

    @Override
    public void transferTo(java.io.File file) throws IOException, IllegalStateException {
        throw new UnsupportedOperationException("This is a ByteArrayMultipartFile");
    }
}
