package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.util.StreamUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;

/**
 * Custom implementation of the Spring MultipartFile interface that wraps a Resource as file content.
 */
public class ResourceMultipartFile implements MultipartFile {

    private static final Logger logger = LoggerFactory.getLogger(ResourceMultipartFile.class);

    private final Resource resource;
    private final String name;
    private final String contentType;

    /**
     * Constructs a ResourceMultipartFile with the given resource, name, and content type.
     *
     * @param resource    The resource representing the file (could be local or remote like S3).
     * @param name        The name of the file.
     * @param contentType The content type of the file.
     * @throws IllegalArgumentException if resource or name is null.
     */
    public ResourceMultipartFile(Resource resource, String name, String contentType) {
        if (resource == null) {
            throw new IllegalArgumentException("Resource cannot be null");
        }
        if (name == null) {
            throw new IllegalArgumentException("Name cannot be null");
        }
        this.resource = resource;
        this.name = name;
        this.contentType = contentType;
    }

    @Override
    public String getName() {
        return this.name;
    }

    @Override
    public String getOriginalFilename() {
        return this.name;
    }

    @Override
    public String getContentType() {
        return this.contentType;
    }

    @Override
    public boolean isEmpty() {
        try {
            return resource.contentLength() == 0;
        } catch (IOException e) {
            logger.warn("Could not determine if resource is empty: {}", name, e);
            return false;
        }
    }

    @Override
    public long getSize() {
        try {
            return resource.contentLength();
        } catch (IOException e) {
            logger.warn("Could not determine size of resource: {}", name, e);
            return -1;
        }
    }

    /**
     * Reads the entire content of the resource into a byte array.
     *
     * @return byte array containing the resource's data.
     * @throws IOException if an I/O error occurs during reading.
     */
    @Override
    public byte[] getBytes() throws IOException {
        try (InputStream is = resource.getInputStream()) {
            return StreamUtils.copyToByteArray(is);
        } catch (IOException e) {
            logger.error("Failed to read bytes from resource: {}", name, e);
            throw e;
        }
    }

    @Override
    public InputStream getInputStream() throws IOException {
        return resource.getInputStream();
    }

    /**
     * Transfers the resource's content to the given destination file.
     *
     * @param dest the destination file.
     * @throws IOException               if an I/O error occurs during transfer.
     * @throws IllegalStateException     if the resource cannot be transferred.
     * @throws NullPointerException      if dest is null.
     */
    @Override
    public void transferTo(File dest) throws IOException, IllegalStateException {
        if (dest == null) {
            throw new IllegalArgumentException("Destination file cannot be null");
        }
        try (InputStream in = resource.getInputStream();
             OutputStream out = new FileOutputStream(dest)) {
            StreamUtils.copy(in, out);
            out.flush();
        } catch (IOException e) {
            logger.error("Failed to transfer resource '{}' to file '{}'", name, dest.getAbsolutePath(), e);
            throw e;
        }
    }

    @Override
    public String toString() {
        return "ResourceMultipartFile{" +
                "resource=" + resource +
                ", name='" + name + '\'' +
                ", contentType='" + contentType + '\'' +
                '}';
    }

    // Optionally, implement equals and hashCode if needed
}
