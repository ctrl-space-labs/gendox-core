package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactData;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactDataRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactAccessService.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * The data of an artifact (gendox-core#600): documents it writes, grouped in collections, for what people do inside
 * it. Shared documents are read by everyone who can see the artifact and written by a Contributor and up; a private
 * document is read and written only by its user, who needs only to see the artifact. The signed-in user is always
 * passed in, never read here; the artifact's access decides on every call.
 */
@Service
public class ArtifactDataService {

    private static final Pattern COLLECTION = Pattern.compile("[A-Za-z0-9_-]{1,64}");
    // never starting with a dot: "." and ".." are path segments, not keys
    private static final Pattern DOC_ID = Pattern.compile("[A-Za-z0-9_:-][A-Za-z0-9_.:-]{0,127}");

    private final ArtifactRepository artifactRepository;
    private final ArtifactDataRepository artifactDataRepository;
    private final ArtifactAccessService artifactAccessService;

    /**
     * Characters one document may hold, as JSON.
     */
    @Value("${gendox.artifacts.data.max-document-length:16000}")
    private int maxDocumentLength = 16_000;

    /**
     * Shared documents one artifact may hold.
     */
    @Value("${gendox.artifacts.data.max-documents:2000}")
    private int maxDocuments = 2_000;

    /**
     * Private documents one person may hold in one artifact: each fills only their own room, never the others'.
     */
    @Value("${gendox.artifacts.data.max-private-documents:200}")
    private int maxPrivateDocuments = 200;

    public ArtifactDataService(ArtifactRepository artifactRepository,
                               ArtifactDataRepository artifactDataRepository,
                               ArtifactAccessService artifactAccessService) {
        this.artifactRepository = artifactRepository;
        this.artifactDataRepository = artifactDataRepository;
        this.artifactAccessService = artifactAccessService;
    }

    /**
     * What the user reads of a collection: its shared documents and their own private ones, the last changed last.
     */
    public List<ArtifactData> list(UUID artifactId, @Nullable UUID userId, String collection) throws GendoxException {
        Artifact artifact = find(artifactId);
        artifactAccessService.require(artifact, userId, Role.VIEW);
        checkCollection(collection);
        return artifactDataRepository.findVisible(artifactId, collection, userId);
    }

    /**
     * One document; one that is not there is not found.
     *
     * @param isPrivate the user's own document of that key, rather than the shared one
     */
    public ArtifactData get(UUID artifactId, @Nullable UUID userId, String collection, String docId, boolean isPrivate)
            throws GendoxException {
        Artifact artifact = find(artifactId);
        artifactAccessService.require(artifact, userId, Role.VIEW);
        checkKey(collection, docId);
        return existing(artifactId, collection, docId, isPrivate ? userId : null)
                .orElseThrow(() -> new GendoxException("ARTIFACT_DATA_NOT_FOUND",
                        "No document " + collection + "/" + docId, HttpStatus.NOT_FOUND));
    }

    /**
     * Writes a whole document, making it when it is not there.
     *
     * @param revision the revision the writer last read; a document changed since is not overwritten. Null writes
     *                 whatever is there; 0 writes only a document that is not there yet.
     */
    // rolled back on a refusal too: a write that lost to another leaves the transaction marked for rollback
    @Transactional(rollbackFor = GendoxException.class)
    public ArtifactData set(UUID artifactId, @Nullable UUID userId, String collection, String docId, JsonNode data,
                            boolean isPrivate, @Nullable Integer revision) throws GendoxException {
        Artifact artifact = find(artifactId);
        requireWrite(artifact, userId, isPrivate);
        checkKey(collection, docId);
        checkData(data);
        Optional<ArtifactData> current = existing(artifactId, collection, docId, isPrivate ? userId : null);
        checkRevision(current, revision, collection, docId);
        return save(artifactId, userId, collection, docId, data, isPrivate, current);
    }

    /**
     * Writes only the given fields of a document, keeping its others; makes it when it is not there.
     */
    @Transactional(rollbackFor = GendoxException.class)
    public ArtifactData update(UUID artifactId, @Nullable UUID userId, String collection, String docId, JsonNode fields,
                               boolean isPrivate, @Nullable Integer revision) throws GendoxException {
        Artifact artifact = find(artifactId);
        requireWrite(artifact, userId, isPrivate);
        checkKey(collection, docId);
        if (!(fields instanceof ObjectNode changes)) {
            throw new GendoxException("ARTIFACT_DATA_NOT_AN_OBJECT",
                    "An update gives an object of the fields to change", HttpStatus.BAD_REQUEST);
        }
        Optional<ArtifactData> current = existing(artifactId, collection, docId, isPrivate ? userId : null);
        checkRevision(current, revision, collection, docId);
        ObjectNode merged = current.map(ArtifactData::getData)
                .filter(ObjectNode.class::isInstance)
                .map(data -> (ObjectNode) data.deepCopy())
                .orElseGet(changes::objectNode);
        merged.setAll(changes);
        checkData(merged);
        return save(artifactId, userId, collection, docId, merged, isPrivate, current);
    }

    /**
     * Deletes a document; deleting one that is not there is not an error.
     */
    @Transactional(rollbackFor = GendoxException.class)
    public void delete(UUID artifactId, @Nullable UUID userId, String collection, String docId, boolean isPrivate)
            throws GendoxException {
        Artifact artifact = find(artifactId);
        requireWrite(artifact, userId, isPrivate);
        checkKey(collection, docId);
        existing(artifactId, collection, docId, isPrivate ? userId : null).ifPresent(artifactDataRepository::delete);
    }

    /**
     * The shared documents of a collection, for an agent whose conversation can already reach the artifact. Private
     * documents never reach an agent.
     */
    public List<ArtifactData> listShared(UUID artifactId, String collection) throws GendoxException {
        checkCollection(collection);
        return artifactDataRepository.findAllByArtifactIdAndCollectionAndPrivateToIsNullOrderByUpdatedAtAscCreatedAtAsc(
                artifactId, collection);
    }

    private ArtifactData save(UUID artifactId, UUID userId, String collection, String docId, JsonNode data,
                              boolean isPrivate, Optional<ArtifactData> current) throws GendoxException {
        ArtifactData document;
        if (current.isPresent()) {
            // the revision is raised by Hibernate, in the same UPDATE that checks it is still the one read
            document = current.get();
            document.setData(data);
            document.setUpdatedBy(userId);
        } else {
            // two limits, so that nobody fills the room of the others: the shared documents, written by Contributors
            // and up, and each person's own private ones. Checked before the write, not under a lock: two writes at
            // the very same moment may pass it by one each, which is fine for a limit against abuse.
            if (isPrivate) {
                if (artifactDataRepository.countByArtifactIdAndPrivateTo(artifactId, userId) >= maxPrivateDocuments) {
                    throw new GendoxException("ARTIFACT_DATA_FULL",
                            "You hold " + maxPrivateDocuments + " private documents in this artifact, the most you may; "
                                    + "delete some first", HttpStatus.BAD_REQUEST);
                }
            } else if (artifactDataRepository.countByArtifactIdAndPrivateToIsNull(artifactId) >= maxDocuments) {
                throw new GendoxException("ARTIFACT_DATA_FULL",
                        "The artifact holds " + maxDocuments + " shared documents, the most it may; delete some first",
                        HttpStatus.BAD_REQUEST);
            }
            document = ArtifactData.builder()
                    .artifactId(artifactId)
                    .collection(collection)
                    .docId(docId)
                    .data(data)
                    .privateTo(isPrivate ? userId : null)
                    .revision(1)
                    .createdBy(userId)
                    .updatedBy(userId)
                    .build();
        }
        try {
            return artifactDataRepository.saveAndFlush(document);
        } catch (DataIntegrityViolationException | ObjectOptimisticLockingFailureException e) {
            // someone made the same document, or changed it, between the read and this write
            throw conflict(collection, docId);
        }
    }

    private void requireWrite(Artifact artifact, @Nullable UUID userId, boolean isPrivate) throws GendoxException {
        // one's own private document needs only to see the artifact; the shared ones, a Contributor
        artifactAccessService.require(artifact, userId, isPrivate ? Role.VIEW : Role.INTERACT);
    }

    private Optional<ArtifactData> existing(UUID artifactId, String collection, String docId, @Nullable UUID privateTo) {
        return privateTo == null
                ? artifactDataRepository.findByArtifactIdAndCollectionAndDocIdAndPrivateToIsNull(artifactId, collection, docId)
                : artifactDataRepository.findByArtifactIdAndCollectionAndDocIdAndPrivateTo(artifactId, collection, docId,
                privateTo);
    }

    private void checkRevision(Optional<ArtifactData> current, @Nullable Integer revision, String collection,
                               String docId) throws GendoxException {
        if (revision == null) {
            return;
        }
        int now = current.map(ArtifactData::getRevision).orElse(0);
        if (now != revision) {
            throw conflict(collection, docId);
        }
    }

    private void checkData(@Nullable JsonNode data) throws GendoxException {
        if (data == null || data.isNull() || data.isMissingNode()) {
            throw new GendoxException("ARTIFACT_DATA_REQUIRED", "A document needs data", HttpStatus.BAD_REQUEST);
        }
        int length = data.toString().length();
        if (length > maxDocumentLength) {
            throw new GendoxException("ARTIFACT_DATA_TOO_LONG",
                    "The document is " + length + " characters; the limit is " + maxDocumentLength,
                    HttpStatus.BAD_REQUEST);
        }
    }

    private static void checkKey(String collection, String docId) throws GendoxException {
        checkCollection(collection);
        if (docId == null || !DOC_ID.matcher(docId).matches()) {
            throw new GendoxException("ARTIFACT_DATA_KEY_NOT_VALID",
                    "A document id is 1 to 128 letters, digits, '_', '-', '.' or ':', not starting with '.'", HttpStatus.BAD_REQUEST);
        }
    }

    private static void checkCollection(String collection) throws GendoxException {
        if (collection == null || !COLLECTION.matcher(collection).matches()) {
            throw new GendoxException("ARTIFACT_DATA_KEY_NOT_VALID",
                    "A collection is 1 to 64 letters, digits, '_' or '-'", HttpStatus.BAD_REQUEST);
        }
    }

    private static GendoxException conflict(String collection, String docId) {
        return new GendoxException("ARTIFACT_DATA_CONFLICT",
                "Document " + collection + "/" + docId + " changed since it was read; read it again", HttpStatus.CONFLICT);
    }

    private Artifact find(UUID artifactId) throws GendoxException {
        return artifactRepository.findById(artifactId)
                .orElseThrow(() -> new GendoxException("ARTIFACT_NOT_FOUND",
                        "No artifact " + artifactId + " that you can open", HttpStatus.NOT_FOUND));
    }
}
