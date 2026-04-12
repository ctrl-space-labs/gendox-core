package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.knuddels.jtokkit.api.Encoding;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionOrderDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.RegexSearchMatchDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.RegexSearchResultDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentSectionMetadataRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentInstanceSectionPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import dev.ctrlspace.gendox.provenAi.utils.MockUniqueIdentifierServiceAdapter;
import dev.ctrlspace.gendox.provenAi.utils.UniqueIdentifierCodeResponse;
import dev.ctrlspace.provenai.iscc.IsccCodeResponse;
import dev.ctrlspace.provenai.iscc.IsccCodeService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.bitbucket.cowwoc.diffmatchpatch.DiffMatchPatch;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

@Service
public class DocumentSectionService {

    Logger logger = LoggerFactory.getLogger(DocumentSectionService.class);

    private TypeService typeService;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private DocumentSectionMetadataRepository documentSectionMetadataRepository;
    private EmbeddingService embeddingService;
    private MockUniqueIdentifierServiceAdapter mockUniqueIdentifierServiceAdapter;
    private MessageService messageService;
    private IsccCodeService isccCodeService;
    private DocumentUtils documentUtils;
    private EntityManager entityManager;

    @Value("${proven-ai.sdk.iscc.enabled}")
    private Boolean isccEnabled;
    private DownloadService downloadService;
    private Encoding gpt4oEncoding;
    private CryptographyUtils cryptographyUtils;
    private SplitFileService splitFileService;
    private DocumentService documentService;
    private AuditLogsService auditLogsService;


    /** Lines of unchanged context kept around each EQUAL region in {@link #patchToDecodedText}. */
    private static final int DIFF_CONTEXT_LINES = 3;
    // Matches Word bookmark anchors like {#_Hlk164247572}
    private static final Pattern WORD_DOC_BOOKMARK = Pattern.compile("\\{#[^}]+}");
    private static final int DIFF_PATCH_MARGIN = 50;



    @Lazy
    @Autowired
    public void setEmbeddingService(EmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }

    @Autowired
    public DocumentSectionService(TypeService typeService,
                                  DocumentInstanceSectionRepository documentInstanceSectionRepository,
                                  DocumentSectionMetadataRepository documentSectionMetadataRepository,
                                  MockUniqueIdentifierServiceAdapter mockUniqueIdentifierServiceAdapter,
                                  MessageService messageService,
                                  IsccCodeService isccCodeService,
                                  DocumentUtils documentUtils,
                                  EntityManager entityManager,
                                  DownloadService downloadService,
                                  Encoding gpt4oEncoding,
                                  CryptographyUtils cryptographyUtils,
                                  SplitFileService splitFileService,
                                  @Lazy DocumentService documentService,
                                  AuditLogsService auditLogsService
    ) {
        this.typeService = typeService;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.documentSectionMetadataRepository = documentSectionMetadataRepository;
        this.mockUniqueIdentifierServiceAdapter = mockUniqueIdentifierServiceAdapter;
        this.messageService = messageService;
        this.isccCodeService = isccCodeService;
        this.documentUtils = documentUtils;
        this.entityManager = entityManager;
        this.downloadService = downloadService;
        this.gpt4oEncoding = gpt4oEncoding;
        this.cryptographyUtils = cryptographyUtils;
        this.splitFileService = splitFileService;
        this.documentService = documentService;
        this.auditLogsService = auditLogsService;
    }


    public DocumentSectionMetadata getMetadataById(UUID id) throws GendoxException {
        return documentSectionMetadataRepository.findById(id)
                .orElseThrow(() -> new GendoxException("METADATA_NOT_FOUND", "Metadata not found with id: " + id, HttpStatus.NOT_FOUND));

    }

    public DocumentSectionMetadata getMetadataBySectionId(UUID sectionId) throws GendoxException {
        DocumentInstanceSection section = getSectionById(sectionId);
        return section.getDocumentSectionMetadata();
    }


    public DocumentInstanceSection getSectionById(UUID id) throws GendoxException {
        return documentInstanceSectionRepository.findById(id)
                .orElseThrow(() -> new GendoxException("SECTION_NOT_FOUND", "Section not found with id: " + id, HttpStatus.NOT_FOUND));

    }


    public Page<DocumentInstanceSection> getAllSections(DocumentInstanceSectionCriteria criteria, Pageable pageable) throws GendoxException {
        return documentInstanceSectionRepository.findAll(DocumentInstanceSectionPredicates.build(criteria), pageable);
    }

    /**
     * Logical lines of the full document: sections in order, one empty string between sections
     * for the blank separator line. Same list underpins {@link #getFullDocumentText} and
     * {@link #getFullNumberedDocumentText}.
     */
    public List<String> getFullDocumentLines(UUID docId) throws GendoxException {
        return collectDocumentLines(sectionsSortedByOrder(docId));
    }

    /**
     * Full document body as plain text: {@link #getFullDocumentLines} joined with newlines
     * (trailing newline when non-empty).
     */
    public String getFullDocumentText(UUID docId) throws GendoxException {
        return joinDocumentLines(getFullDocumentLines(docId));
    }

    /**
     * Same lines as {@link #getFullDocumentText} with each line prefixed {@code N | }
     * (1-based). Matches document-insights convention and {@code line_start}/{@code line_end} tools.
     */
    public String getFullNumberedDocumentText(UUID docId) throws GendoxException {
        return toNumberedDocumentText(getFullDocumentLines(docId));
    }

    private List<DocumentInstanceSection> sectionsSortedByOrder(UUID docId) {
        List<DocumentInstanceSection> sections = this.getSectionsByDocument(docId);
        sections.sort(Comparator.comparingInt(
                s -> s.getDocumentSectionMetadata().getSectionOrder()
        ));
        return sections;
    }

    /**
     * Flattens sections into one list of lines; inserts {@code ""} between sections for the
     * inter-section blank line (same layout as before).
     */
    private static List<String> collectDocumentLines(List<DocumentInstanceSection> sections) {
        List<String> lines = new ArrayList<>();
        for (int sectionIdx = 0; sectionIdx < sections.size(); sectionIdx++) {
            String sectionText = Optional.ofNullable(sections.get(sectionIdx))
                    .map(DocumentInstanceSection::getSectionValue)
                    .orElse("");
            for (String line : sectionText.split("\\R", -1)) {
                lines.add(line);
            }
            if (sectionIdx < sections.size() - 1) {
                lines.add("");
            }
        }
        return lines;
    }

    private static String joinDocumentLines(List<String> lines) {
        if (lines.isEmpty()) {
            return "";
        }
        return String.join("\n", lines) + "\n";
    }

    private static String toNumberedDocumentText(List<String> lines) {
        if (lines.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        int n = 1;
        for (String line : lines) {
            sb.append(n).append(" | ").append(line).append("\n");
            n++;
        }
        return sb.toString();
    }

    /**
     * Compare two documents by full plain text (see {@link #getFullDocumentText}) and return
     * semantic diff hunks, similar to {@code git diff a b} — DELETE only in {@code a}, INSERT only in {@code b}.
     */
    public List<DiffMatchPatch.Patch> diffDocuments(UUID documentAId, UUID documentBId) throws GendoxException {
        return diffPatches(getFullDocumentText(documentAId), getFullDocumentText(documentBId));
    }



    /**
     * Compare two arbitrary plain-text strings using diff-match-patch: semantic cleanup, EQUAL
     * segments trimmed to {@link #DIFF_CONTEXT_LINES} lines of context when long.
     */
    public List<DiffMatchPatch.Patch> diffPatches(String textA, String textB) {
        DiffMatchPatch dmp = new DiffMatchPatch();
        dmp.patchMargin = DIFF_PATCH_MARGIN;
        LinkedList<DiffMatchPatch.Diff> diffs = dmp.diffMain(removeWordDocBookmark(textA), removeWordDocBookmark(textB));
        dmp.diffCleanupSemantic(diffs);
        List<DiffMatchPatch.Patch> patches = dmp.patchMake(diffs);
        return patches;
    }

    /**
     * Converts a list of diff-match-patch patches into a decoded text representation.
     *
     * <p>The {@code patchToText} output is URL-encoded by the library, so this method
     * decodes it back into readable text while preserving literal {@code +} patch
     * markers by first escaping them as {@code %2B}. This is useful for logging,
     * inspection, or sending patch content to an LLM.</p>
     *
     * <p>Note: the returned value is a decoded view intended for readability, not the
     * canonical patch text format that should be used for patch round-tripping.</p>
     *
     * @param patches the patches to serialize and decode
     * @return a human-readable decoded patch text
     */
    public String patchToDecodedText(List<DiffMatchPatch.Patch> patches) {
        DiffMatchPatch dmp = new DiffMatchPatch();
        dmp.patchMargin = DIFF_PATCH_MARGIN;
        return URLDecoder.decode(
                dmp.patchToText(patches).replace("+", "%2B"),
                StandardCharsets.UTF_8
        );
    }

    private String removeWordDocBookmark(String text) {
        // Strip Word bookmarks — they are never contract content
        return WORD_DOC_BOOKMARK.matcher(text).replaceAll("");
    }

    /**
     * Scans the logical lines of each document ({@link #getFullDocumentLines}) and returns every
     * line that matches at least one of the given Java regex patterns. Invalid patterns are
     * collected in {@link RegexSearchResultDTO#invalidPatterns()} and skipped for matching.
     */
    public RegexSearchResultDTO searchDocumentsWithRegex(List<UUID> documentIds,
                                                         List<String> rawPatterns,
                                                         boolean caseInsensitive) throws GendoxException {
        int flags = caseInsensitive ? Pattern.CASE_INSENSITIVE : 0;
        List<CompiledRegex> compiled = new ArrayList<>();
        List<String> invalidPatterns = new ArrayList<>();
        for (String raw : rawPatterns) {
            try {
                compiled.add(new CompiledRegex(raw, Pattern.compile(raw, flags)));
            } catch (PatternSyntaxException e) {
                logger.warn("Invalid regex pattern '{}': {}", raw, e.getMessage());
                invalidPatterns.add(raw);
            }
        }

        List<RegexSearchMatchDTO> matches = new ArrayList<>();
        for (UUID docId : documentIds) {
            List<String> lines = getFullDocumentLines(docId);
            String docIdStr = docId.toString();
            for (int i = 0; i < lines.size(); i++) {
                String content = lines.get(i);
                int lineNum = i + 1;
                String previousLine = i > 0 ? lines.get(i - 1) : null;
                String nextLine = i < lines.size() - 1 ? lines.get(i + 1) : null;
                for (CompiledRegex cp : compiled) {
                    Matcher m = cp.pattern().matcher(content);
                    if (m.find()) {
                        StringBuilder sb = new StringBuilder();
                        matches.add(new RegexSearchMatchDTO(
                                docIdStr, lineNum, cp.raw(),
                                sb
                                        .append(previousLine).append("\n")
                                        .append(">").append(content).append("\n")
                                        .append(nextLine)
                                        .toString()));

                        break;
                    }
                }
            }
            logger.debug("searchDocumentsWithRegex: document {} -> {} matches cumulative", docId, matches.size());
        }

        return new RegexSearchResultDTO(
                matches.size(),
                matches,
                invalidPatterns.isEmpty() ? null : invalidPatterns
        );
    }

    private record CompiledRegex(String raw, Pattern pattern) {}

    /**
     * TODO merge this with the above to findSectionsByCriteria
     *
     * @param projectId
     * @param sectionIds
     * @return
     */
    public List<DocumentInstanceSection> getSectionsBySectionsIn(UUID projectId, Set<UUID> sectionIds) {
        return documentInstanceSectionRepository.findByProjectAndSectionIds(projectId, sectionIds);
    }


    public List<DocumentInstanceSection> getProjectSections(UUID projectId) throws GendoxException {
        return documentInstanceSectionRepository.findByProjectId(projectId);
    }

    public List<DocumentInstanceSection> getSectionsByDocument(UUID documentInstanceId) {
        return documentInstanceSectionRepository.findByDocumentInstance(documentInstanceId);
    }

    @Transactional
    public List<DocumentInstanceSection> createSections(DocumentInstance documentInstance, List<String> contentSections) throws GendoxException {
        // if the document instance already has sections in the database, delete it
        this.deleteSectionsByDocumentId(documentInstance.getId());
        List<DocumentInstanceSection> sections = new ArrayList<>();
        Integer sectionOrder = 0;
        for (String contentSection : contentSections) {
            sectionOrder++;
            DocumentInstanceSection section = createSection(documentInstance, contentSection, sectionOrder);
            sections.add(section);
        }

        sections = documentInstanceSectionRepository.saveAll(sections);

        return sections;
    }

    public DocumentInstanceSection createSection(DocumentInstance documentInstance, String fileContent, Integer sectionOrder) throws GendoxException {
        DocumentInstanceSection section = new DocumentInstanceSection();
        // create section's metadata
        DocumentSectionMetadata metadata = new DocumentSectionMetadata();
        metadata.setDocumentSectionTypeId(typeService.getDocumentTypeByName("FIELD_TEXT").getId());
        metadata.setTitle("Default Title");
        metadata.setSectionOrder(sectionOrder);

        section.setDocumentSectionMetadata(metadata);
        section.setSectionValue(fileContent);
        section.setDocumentInstance(documentInstance);


        String documentSectionIsccCode = generateDocumentSectionIsccCode(section);


        section.setDocumentSectionIsccCode(documentSectionIsccCode);

        // take moderation check
//        OpenAiGpt35ModerationResponse openAiGpt35ModerationResponse = trainingService.getModeration(section.getSectionValue());
//        section.setHasContentWarning(openAiGpt35ModerationResponse.getResults().get(0).isFlagged());

        //create metadata
        section.setDocumentSectionMetadata(createMetadata(section));
//        // sava section
//        section = documentInstanceSectionRepository.save(section);


        return section;
    }

    public DocumentInstanceSection createNewSection(DocumentInstance documentInstance, String fileContent, String sectionTitle) throws GendoxException {
        Integer sectionOrder = 2;
        DocumentInstanceSection section = new DocumentInstanceSection();
        // create section's metadata
        DocumentSectionMetadata metadata = new DocumentSectionMetadata();
        metadata.setDocumentSectionTypeId(typeService.getDocumentTypeByName("FIELD_TEXT").getId());
        metadata.setTitle(sectionTitle);
        metadata.setSectionOrder(sectionOrder);

        section.setDocumentSectionMetadata(metadata);
        section.setSectionValue(fileContent);
        section.setDocumentInstance(documentInstance);

        String fileName = documentUtils.extractDocumentNameFromUrl(section.getDocumentInstance().getRemoteUrl());


        String documentSectionIsccCode = generateDocumentSectionIsccCode(section);

        section.setDocumentSectionIsccCode(documentSectionIsccCode);


        // take moderation check
//        OpenAiGpt35ModerationResponse openAiGpt35ModerationResponse = trainingService.getModeration(section.getSectionValue());
//        section.setHasContentWarning(openAiGpt35ModerationResponse.getResults().get(0).isFlagged());

        //create metadata
        section.setDocumentSectionMetadata(createMetadata(section));
        // sava section
        section = documentInstanceSectionRepository.save(section);


        return section;
    }


    public DocumentInstanceSection createNewSection(DocumentInstance documentInstance) throws GendoxException {
        DocumentInstanceSection newSection = new DocumentInstanceSection();
        DocumentSectionMetadata metadata = new DocumentSectionMetadata();
        metadata.setDocumentSectionTypeId(typeService.getDocumentTypeByName("FIELD_TEXT").getId());
        metadata.setTitle("Default Title");
        metadata.setSectionOrder(documentInstance.getDocumentInstanceSections().size() + 1);
        metadata = documentSectionMetadataRepository.save(metadata);
        newSection.setDocumentInstance(documentInstance);
        newSection.setDocumentSectionMetadata(metadata);
        newSection.setHasContentWarning(false);
        newSection = documentInstanceSectionRepository.save(newSection);
        return newSection;
    }

    public String generateDocumentSectionIsccCode(DocumentInstanceSection newSection) throws GendoxException {
        String documentSectionIsccCode;
        String fileName = documentUtils.extractDocumentNameFromUrl(newSection.getDocumentInstance().getRemoteUrl());


        if (isccEnabled) {
            IsccCodeResponse sectionIsccCodeResponse = isccCodeService.getDocumentUniqueIdentifier(
                    newSection.getSectionValue().getBytes(), fileName);
            documentSectionIsccCode = sectionIsccCodeResponse.getIscc();
        } else {
            UniqueIdentifierCodeResponse sectionUniqueIdentifierCodeResponse = mockUniqueIdentifierServiceAdapter.getDocumentUniqueIdentifier(
                    newSection.getSectionValue().getBytes(), fileName);
            documentSectionIsccCode = sectionUniqueIdentifierCodeResponse.getUuid();
        }

        return documentSectionIsccCode;
    }


    public DocumentSectionMetadata createMetadata(DocumentInstanceSection section) throws GendoxException {
        DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();


        if (metadata.getDocumentSectionTypeId() == null || metadata.getSectionOrder() == null) {
            throw new GendoxException("SECTION_TYPE_ID_AND_SECTION_ORDER_MUST_NOT_NULL", " SectionTypeId and SectionOrder must not be null", HttpStatus.BAD_REQUEST);
        }

        metadata = documentSectionMetadataRepository.save(metadata);

        return metadata;
    }


    public List<DocumentInstanceSection> updateSections(DocumentInstance instance) throws GendoxException {
        List<DocumentInstanceSection> documentInstanceSections = new ArrayList<>();

        for (DocumentInstanceSection section : instance.getDocumentInstanceSections()) {
            section.setDocumentInstance(instance);
            DocumentInstanceSection savedSection = updateExistingSection(section);
            documentInstanceSections.add(savedSection);
        }

        documentInstanceSections = documentInstanceSectionRepository.saveAll(documentInstanceSections);

        return documentInstanceSections;
    }

    public DocumentInstanceSection updateExistingSection(DocumentInstanceSection section) throws GendoxException {
        UUID sectionId = section.getId();
        DocumentInstanceSection existingSection = this.getSectionById(sectionId);
        existingSection.setSectionValue(section.getSectionValue());
        String fileName = documentUtils.extractDocumentNameFromUrl(existingSection.getDocumentInstance().getRemoteUrl());
//        UniqueIdentifierCodeResponse sectionUniqueIdentifierCodeResponse = mockUniqueIdentifierServiceAdapter.getDocumentUniqueIdentifier(
//                existingSection.getSectionValue().getBytes(), fileName);
        IsccCodeResponse sectionUniqueIdentifierCodeResponse = isccCodeService.getDocumentUniqueIdentifier(
                existingSection.getSectionValue().getBytes(), fileName);
//        existingSection.setDocumentSectionIsccCode(sectionUniqueIdentifierCodeResponse.getUuid());
        existingSection.setDocumentSectionIsccCode(sectionUniqueIdentifierCodeResponse.getIscc());

        existingSection.setDocumentSectionMetadata(updateMetadata(section));

        return existingSection;
    }


    public DocumentInstanceSection updateSection(DocumentInstanceSection section) throws GendoxException {

        UUID sectionId = section.getId();
        DocumentInstanceSection existingSection = this.getSectionById(sectionId);

        existingSection.setSectionValue(section.getSectionValue());
        String fileName = documentUtils.extractDocumentNameFromUrl(existingSection.getDocumentInstance().getRemoteUrl());
//      ISCC code
//        UniqueIdentifierCodeResponse sectionUniqueIdentifierCodeResponse = isccCodeServiceAdapter.getDocumentUniqueIdentifier(
//                                                                existingSection.getSectionValue().getBytes(), fileName);
//      Mock Unique Identifier Code: UUID
        UniqueIdentifierCodeResponse sectionUniqueIdentifierCodeResponse = mockUniqueIdentifierServiceAdapter.getDocumentUniqueIdentifier(
                existingSection.getSectionValue().getBytes(), fileName);

//        existingSection.setDocumentSectionIsccCode(sectionUniqueIdentifierCodeResponse.getIscc());
        existingSection.setDocumentSectionIsccCode(sectionUniqueIdentifierCodeResponse.getUuid());

        // Check if documentInstance.documentTemplateId is empty/null before updating metadata
//        if (section.getDocumentInstance().getDocumentTemplateId() == null) {
        existingSection.setDocumentSectionMetadata(updateMetadata(section));
//        }

        existingSection = documentInstanceSectionRepository.save(existingSection);

        return existingSection;
    }


    public DocumentSectionMetadata updateMetadata(DocumentInstanceSection section) throws GendoxException {
        UUID metadataId = section.getDocumentSectionMetadata().getId();
        DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();
        DocumentSectionMetadata existingMetadata = this.getMetadataById(metadataId);

        existingMetadata.setDocumentTemplateId(metadata.getDocumentTemplateId());
        existingMetadata.setDocumentSectionTypeId(metadata.getDocumentSectionTypeId());
        existingMetadata.setTitle(metadata.getTitle());
        existingMetadata.setDescription(metadata.getDescription());
        existingMetadata.setSectionOptions(metadata.getSectionOptions());
        existingMetadata.setSectionOrder(metadata.getSectionOrder());


        existingMetadata = documentSectionMetadataRepository.save(existingMetadata);

        return existingMetadata;
    }

    public void updateSectionsOrder(List<DocumentInstanceSectionOrderDTO> sectionOrderDTOs) throws GendoxException {

        for (DocumentInstanceSectionOrderDTO sectionOrderDTO : sectionOrderDTOs) {
            DocumentSectionMetadata metadata = this.getMetadataById(sectionOrderDTO.getDocumentSectionMetadataId());
            metadata.setSectionOrder(sectionOrderDTO.getSectionOrder());
            documentSectionMetadataRepository.save(metadata);
        }


    }

    public void deleteSection(DocumentInstanceSection section) throws GendoxException {
        messageService.deleteMessageSection(section.getId());
        DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();
        embeddingService.deleteEmbeddingGroupsBySection(section.getId());
        documentInstanceSectionRepository.delete(section);
        deleteMetadata(metadata);
    }

    @Transactional
    public void deleteSectionsByDocumentId(UUID documentId) throws GendoxException {
        if (documentId == null) {
            return;
        }

        // delete MessageSections associated with these sections
        messageService.deleteMessageSectionsByDocumentId(documentId);

        // delete EmbeddingGroups and embeddings associated with these sections
        embeddingService.deleteEmbeddingGroupsByDocumentId(documentId);

        // delete the sections
        documentInstanceSectionRepository.deleteSectionsAndOrphanMetadata(documentId);

        entityManager.flush();
        entityManager.clear();
    }

    public void deleteMetadata(DocumentSectionMetadata metadata) throws GendoxException {
        documentSectionMetadataRepository.delete(metadata);
    }


    /**
     *  End-to-End split of document:
     *  * Read document content
     *  * Check if has changed since last split (by comparing document hash)
     *  * If changed, split document into sections
     *  * calculate new hash, total tokens and update document instance
     *  * Create Sections
     *
     * @param documentInstance
     * @param changeCheckFlag flag to enable checking if the document has changed since last split.
     * @return
     * @throws GendoxException
     */
    @Transactional(rollbackOn = Exception.class)
    public List<DocumentInstanceSection> splitDocumentAndCreateSections(DocumentInstance documentInstance, boolean changeCheckFlag) throws GendoxException, IOException, NoSuchAlgorithmException {

        String fileContent;
        try {
            fileContent = downloadService.readDocumentContent(documentInstance.getRemoteUrl());
        } catch (GendoxException e) {
            if ("ERROR_IMAGE_FILE_TYPE".equals(e.getErrorCode())) {
                fileContent = ""; // For image files, no sections will be created
            } else {
                throw e;
            }
        }

        if (changeCheckFlag) {
            boolean hasChanged = documentUtils.hasChanged(fileContent, documentInstance.getDocumentSha256Hash());
            if (!hasChanged) {
                logger.trace("Document {} has not changed since last split. Skipping section creation.", documentInstance.getId());
                return this.getSectionsByDocument(documentInstance.getId());
            }
        }

        List<String> contentSections = splitFileService.splitDocument(documentInstance, fileContent);
        logger.debug("Creating {} sections for document instance {}", contentSections.size(), documentInstance.getId());

        int totalTokens = gpt4oEncoding.countTokens(fileContent);
        // TODO in case of image files, the hash is always for the "" string, not the actual file content.
        String contentSHA256 = cryptographyUtils.calculateSHA256(fileContent);
        
        documentInstance.setTotalTokens((long)totalTokens);
        documentInstance.setDocumentSha256Hash(contentSHA256);
        documentInstance = documentService.saveDocumentInstance(documentInstance);

        List<DocumentInstanceSection> documentSections =
                this.createSections(documentInstance, contentSections);

        auditLogsService.createAuditLog(documentInstance.getOrganizationId(),
                null,"CREATE_DOCUMENT_SECTIONS", (long) documentSections.size());

        
        return documentSections;
    }

}
