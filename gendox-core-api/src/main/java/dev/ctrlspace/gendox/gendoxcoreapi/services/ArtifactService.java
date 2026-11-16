package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactEditDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactVersionSummaryDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactVersionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ArtifactPredicates;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Artifacts of a chat thread. Every read and write names the thread: an artifact of another thread
 * is not found, for the agent's tools and the REST API alike.
 */
@Service
public class ArtifactService {

    public static final String CODE_TYPE = "CODE";

    private final ArtifactRepository artifactRepository;
    private final ArtifactVersionRepository artifactVersionRepository;
    private final TypeService typeService;
    private final ChatThreadRepository chatThreadRepository;

    /**
     * Characters one version may hold.
     */
    @Value("${gendox.artifacts.max-content-length:200000}")
    private int maxContentLength = 200_000;

    public ArtifactService(ArtifactRepository artifactRepository,
                           ArtifactVersionRepository artifactVersionRepository,
                           TypeService typeService,
                           ChatThreadRepository chatThreadRepository) {
        this.artifactRepository = artifactRepository;
        this.artifactVersionRepository = artifactVersionRepository;
        this.typeService = typeService;
        this.chatThreadRepository = chatThreadRepository;
    }

    /**
     * @param typeName     a name of category ARTIFACT_TYPE, in any case: the model sends "html"
     * @param codeLanguage kept for type CODE only
     * @param messageId    the assistant message whose tool call writes it
     */
    @Transactional
    public Artifact create(UUID threadId, UUID projectId, @Nullable UUID messageId, String title,
                           String typeName, @Nullable String codeLanguage, String content) throws GendoxException {
        if (title == null || title.isBlank()) {
            throw new GendoxException("ARTIFACT_TITLE_REQUIRED", "An artifact needs a title", HttpStatus.BAD_REQUEST);
        }
        Type artifactType = getArtifactType(typeName);
        validateContent(content);

        boolean isCode = CODE_TYPE.equals(artifactType.getName());
        Artifact artifact = artifactRepository.save(Artifact.builder()
                .threadId(threadId)
                .projectId(projectId)
                .title(title.trim())
                .artifactType(artifactType)
                .codeLanguage(isCode && codeLanguage != null && !codeLanguage.isBlank() ? codeLanguage.trim() : null)
                .latestVersion(1)
                .build());
        saveVersion(artifact, content, messageId);
        return artifact;
    }

    /**
     * A new version from the whole {@code content} or from {@code edits} on the latest one, never both.
     * A new {@code title} alone renames the artifact and adds no version.
     */
    @Transactional
    public Artifact update(UUID threadId, UUID artifactId, @Nullable UUID messageId, @Nullable String title,
                           @Nullable String content, @Nullable List<ArtifactEditDTO> edits) throws GendoxException {
        boolean hasContent = content != null;
        boolean hasEdits = edits != null && !edits.isEmpty();
        boolean hasTitle = title != null && !title.isBlank();
        if (hasContent && hasEdits) {
            throw new GendoxException("ARTIFACT_UPDATE_AMBIGUOUS",
                    "Give either edits or the whole content, not both", HttpStatus.BAD_REQUEST);
        }
        if (!hasContent && !hasEdits && !hasTitle) {
            throw new GendoxException("ARTIFACT_UPDATE_EMPTY",
                    "Nothing to update: give edits, the whole content, or a new title", HttpStatus.BAD_REQUEST);
        }

        // locked until the transaction ends, so a second update of the same artifact waits and numbers after this one
        Artifact artifact = artifactRepository.lockByIdAndThreadId(artifactId, threadId)
                .orElseThrow(() -> notInThread(artifactId, threadId));
        if (hasTitle) {
            artifact.setTitle(title.trim());
        }
        if (hasContent || hasEdits) {
            String next = hasContent ? content : applyEdits(getVersion(artifact, null).getContent(), edits);
            validateContent(next);
            artifact.setLatestVersion(artifact.getLatestVersion() + 1);
            saveVersion(artifact, next, messageId);
        }
        return artifactRepository.save(artifact);
    }

    public List<Artifact> getAllByThread(UUID threadId) {
        return artifactRepository.findAllByThreadIdOrderByCreatedAtAsc(threadId);
    }

    /**
     * A page of artifacts across conversations. The criteria must carry the project and the user (see
     * {@link ArtifactCriteria}); without them the page is empty.
     */
    public Page<Artifact> getAll(ArtifactCriteria criteria, Pageable pageable) {
        return artifactRepository.findAll(ArtifactPredicates.build(criteria), pageable);
    }

    /**
     * The names of the conversations the artifacts came from, in one query: { threadId: name }.
     */
    public Map<UUID, String> threadNamesOf(List<Artifact> artifacts) {
        List<UUID> threadIds = artifacts.stream().map(Artifact::getThreadId).distinct().toList();
        if (threadIds.isEmpty()) {
            return Map.of();
        }
        return chatThreadRepository.findAllById(threadIds).stream()
                .collect(Collectors.toMap(ChatThread::getId, ChatThread::getName));
    }

    public Artifact getByIdInThread(UUID threadId, UUID artifactId) throws GendoxException {
        return artifactRepository.findByIdAndThreadId(artifactId, threadId)
                .orElseThrow(() -> notInThread(artifactId, threadId));
    }

    /**
     * @param version null for the latest
     */
    public ArtifactVersion getVersion(Artifact artifact, @Nullable Integer version) throws GendoxException {
        int wanted = version != null ? version : artifact.getLatestVersion();
        return artifactVersionRepository.findByArtifactIdAndVersion(artifact.getId(), wanted)
                .orElseThrow(() -> new GendoxException("ARTIFACT_VERSION_NOT_FOUND",
                        "Artifact " + artifact.getId() + " has no version " + wanted
                                + ". Its versions are 1 to " + artifact.getLatestVersion(), HttpStatus.NOT_FOUND));
    }

    public List<ArtifactVersionSummaryDTO> getVersionSummaries(UUID artifactId) {
        return artifactVersionRepository.findSummariesByArtifactId(artifactId);
    }

    /**
     * Applies the edits in order, each on the result of the one before. An edit whose old text is
     * missing or occurs more than once stops everything: a guess would change the wrong place.
     */
    // package-private for tests
    static String applyEdits(String content, List<ArtifactEditDTO> edits) throws GendoxException {
        String result = content;
        for (int i = 0; i < edits.size(); i++) {
            ArtifactEditDTO edit = edits.get(i);
            String oldText = edit.getOldText();
            if (oldText == null || oldText.isEmpty()) {
                throw new GendoxException("ARTIFACT_EDIT_INVALID",
                        "Edit " + (i + 1) + ": old_text is empty. No edit was applied.", HttpStatus.BAD_REQUEST);
            }
            int first = result.indexOf(oldText);
            if (first < 0) {
                throw new GendoxException("ARTIFACT_EDIT_NOT_FOUND",
                        "Edit " + (i + 1) + ": old_text was not found in the artifact. No edit was applied. "
                                + "Read the artifact with read_artifact and copy the text exactly.", HttpStatus.BAD_REQUEST);
            }
            if (result.indexOf(oldText, first + 1) >= 0) {
                throw new GendoxException("ARTIFACT_EDIT_NOT_UNIQUE",
                        "Edit " + (i + 1) + ": old_text occurs more than once in the artifact. No edit was applied. "
                                + "Include more of the surrounding text so it matches one place only.", HttpStatus.BAD_REQUEST);
            }
            String newText = edit.getNewText() == null ? "" : edit.getNewText();
            result = result.substring(0, first) + newText + result.substring(first + oldText.length());
        }
        return result;
    }

    /**
     * The type of category ARTIFACT_TYPE with this name; the error names the ones there are.
     */
    private Type getArtifactType(@Nullable String typeName) throws GendoxException {
        List<Type> artifactTypes = typeService.getArtifactTypes();
        String wanted = typeName == null ? "" : typeName.trim().toUpperCase(Locale.ROOT);
        return artifactTypes.stream()
                .filter(type -> type.getName().equals(wanted))
                .findFirst()
                .orElseThrow(() -> new GendoxException("ARTIFACT_TYPE_NOT_SUPPORTED",
                        "Kind '" + typeName + "' is not supported. Use one of: " + artifactTypes.stream()
                                .map(type -> type.getName().toLowerCase(Locale.ROOT))
                                .sorted()
                                .collect(Collectors.joining(", ")),
                        HttpStatus.BAD_REQUEST));
    }

    private void saveVersion(Artifact artifact, String content, @Nullable UUID messageId) {
        artifactVersionRepository.save(ArtifactVersion.builder()
                .artifactId(artifact.getId())
                .version(artifact.getLatestVersion())
                .content(content)
                .messageId(messageId)
                .build());
    }

    private void validateContent(@Nullable String content) throws GendoxException {
        if (content == null || content.isBlank()) {
            throw new GendoxException("ARTIFACT_CONTENT_REQUIRED", "The artifact has no content", HttpStatus.BAD_REQUEST);
        }
        if (content.length() > maxContentLength) {
            throw new GendoxException("ARTIFACT_CONTENT_TOO_LONG",
                    "The content is " + content.length() + " characters; the limit is " + maxContentLength
                            + ". Make it more compact.", HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Names the thread's own artifacts, so an agent that used a wrong id can correct its call.
     */
    private GendoxException notInThread(UUID artifactId, UUID threadId) {
        String available = getAllByThread(threadId).stream()
                .map(artifact -> artifact.getId() + " (" + artifact.getTitle() + ")")
                .collect(Collectors.joining(", "));
        return new GendoxException("ARTIFACT_NOT_FOUND",
                "No artifact " + artifactId + " in this conversation. Artifacts here: "
                        + (available.isEmpty() ? "none" : available), HttpStatus.NOT_FOUND);
    }
}