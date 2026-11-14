package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AgentDocumentAccess;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageLocalContextRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DownloadService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageLocalContextService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.ImageUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.WordToPdfConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.DocFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.DocxFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.ExcelFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.PptxFileReader;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.data.domain.PageImpl;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** What an agent is shown about files by the tools: the same lines everywhere, and line numbers that agree. */
class AgentFileToolsTest {

    private final ObjectMapper objectMapper = JsonMapper.shared();
    private final UUID documentId = UUID.fromString("1c4b2e90-0000-0000-0000-000000000001");

    @Test
    void aSearchHitNamesItsFileAndTheLinesReadDocumentWouldShow() throws Exception {
        DocumentSectionService sections = documentWith("Intro\nScope", "Hoses above 350 bar\nmust be tested", "End");
        UUID hitId = sections.getSectionsByDocument(documentId).get(1).getId();

        DocumentInstanceDTO document = DocumentInstanceDTO.builder().id(documentId).title("manual.pdf")
                .updateAt(Instant.parse("2026-11-12T14:03:00Z")).build();
        DocumentInstanceSectionDTO hit = DocumentInstanceSectionDTO.builder().id(hitId).documentInstanceDTO(document)
                .sectionValue("Hoses above 350 bar\nmust be tested").distanceFromQuestion(0.12345).build();
        EmbeddingService embeddingService = mock(EmbeddingService.class);
        when(embeddingService.findClosestSectionsByQuery(eq("hose pressure"), any(), any(), any())).thenReturn(new ArrayList<>(List.of(hit)));
        ProjectAgent agent = new ProjectAgent();
        agent.setMaxSearchLimit(5L);
        agent.setMaxCompletionLimit(5L);

        JsonNode found = new AdvancedSearchTool(embeddingService, sections, objectMapper)
                .execute(objectMapper.valueToTree("{\"search_query\":\"hose pressure\"}"),
                        new ToolExecutionContext(new Project(), agent, null, null, null, null))
                .get("sections").get(0);

        // the answer's sources are read from these two
        assertEquals(hitId.toString(), found.get("section_id").asText());
        assertEquals(documentId.toString(), found.get("document_id").asText());
        assertEquals("./knowledge/manual.pdf | lines=4-5 | modified=2026-11-12 14:03 | distance=0.123 | UUID=" + documentId,
                found.get("file").asText());
        assertEquals("4 | Hoses above 350 bar\n5 | must be tested\n", found.get("section_text").asText());
        // the same lines the whole document shows
        assertTrue(sections.getFullNumberedDocumentText(documentId).contains(found.get("section_text").asText()));
    }

    @Test
    void listFilesShowsTheKnowledgeBaseAPageAtATimeAndEveryFileOfTheConversation() throws Exception {
        DocumentInstance manual = file("manual.pdf");
        DocumentService documentService = mock(DocumentService.class);
        when(documentService.getAllDocuments(any(), any())).thenReturn(new PageImpl<>(List.of(manual)));
        MessageLocalContextRepository contexts = mock(MessageLocalContextRepository.class);
        Message question = new Message();
        question.setThreadId(UUID.randomUUID());
        question.setCreatedAt(Instant.now());
        DocumentInstance upload = file("contract.pdf");
        when(contexts.findThreadDocuments(question.getThreadId(), question.getCreatedAt())).thenReturn(List.of(upload));
        Project project = new Project();
        project.setId(UUID.randomUUID());
        ToolExecutionContext context = new ToolExecutionContext(project, null, question, null, null, null);
        ListFilesTool tool = new ListFilesTool(documentService, new MessageLocalContextService(null, contexts, null), objectMapper);

        String knowledge = tool.execute(objectMapper.valueToTree("{\"scope\":\"knowledge\"}"), context).get("files").asText();
        String uploads = tool.execute(objectMapper.valueToTree("{\"scope\":\"uploads\"}"), context).get("files").asText();

        assertTrue(knowledge.startsWith("./knowledge\n./knowledge/manual.pdf | "));
        assertTrue(knowledge.endsWith("(page 0 of 1, 1 files)"));
        assertEquals(2, uploads.lines().count());
        assertTrue(uploads.startsWith("./uploads\n./uploads/contract.pdf | "));
    }

    @Test
    void viewPagePrintsThePageAsAnImageAndRefusesAPageTheDocumentDoesNotHave() throws Exception {
        DownloadService downloadService = new DownloadService(new DefaultResourceLoader(), new ImageUtils(mock(DownloadService.class)),
                "Page %s\n", new ExcelFileReader(), new DocxFileReader(), new DocFileReader(), new PptxFileReader(), new WordToPdfConverter());
        DocumentInstance report = file("report.docx");
        report.setRemoteUrl("classpath:/test-data/word-docs/file-sample_100kB.docx");
        report.setNumberOfPages(downloadService.countDocumentPages(report.getRemoteUrl()));
        DocumentService documentService = mock(DocumentService.class);
        when(documentService.getDocumentInstanceById(report.getId())).thenReturn(report);
        ViewPageTool tool = new ViewPageTool(documentService, downloadService, mock(AgentDocumentAccess.class), objectMapper);
        ToolExecutionContext context = new ToolExecutionContext(new Project(), null, null, null, null, null);

        JsonNode shown = tool.execute(objectMapper.valueToTree("{\"document_id\":\"%s\",\"page\":1}".formatted(report.getId())), context);

        // the result is a sentence; the image goes beside it, never as text
        assertTrue(shown.get("status").asText().startsWith("Page 1 of " + report.getNumberOfPages()));
        assertEquals(1, context.images().size());
        assertTrue(context.images().getFirst().getImageUrl().getUrl().startsWith("data:image/"));

        GendoxException refused = assertThrows(GendoxException.class, () -> tool.execute(
                objectMapper.valueToTree("{\"document_id\":\"%s\",\"page\":%d}".formatted(report.getId(), report.getNumberOfPages() + 1)), context));
        assertEquals("PAGE_OUT_OF_RANGE", refused.getErrorCode());
        assertEquals(1, context.images().size());
    }

    /** A document service that has only this document, its sections in the given order. */
    private DocumentSectionService documentWith(String... sectionTexts) throws Exception {
        List<DocumentInstanceSection> sections = new ArrayList<>();
        for (String text : sectionTexts) {
            DocumentSectionMetadata metadata = new DocumentSectionMetadata();
            metadata.setSectionOrder(sections.size());
            DocumentInstanceSection section = new DocumentInstanceSection();
            section.setId(UUID.randomUUID());
            section.setSectionValue(text);
            section.setDocumentSectionMetadata(metadata);
            sections.add(section);
        }
        DocumentSectionService service = mock(DocumentSectionService.class);
        when(service.getSectionsByDocument(documentId)).thenReturn(sections);
        when(service.getSectionFirstLines(documentId)).thenCallRealMethod();
        when(service.getFullDocumentLines(documentId)).thenCallRealMethod();
        when(service.getFullNumberedDocumentText(documentId)).thenCallRealMethod();
        return service;
    }

    private static DocumentInstance file(String title) {
        DocumentInstance file = new DocumentInstance();
        file.setId(UUID.randomUUID());
        file.setTitle(title);
        return file;
    }
}
