package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;


public class ResourceMultipartFile implements MultipartFile {

    private final byte[] content;
    private final String name;
    private final String contentType;

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
