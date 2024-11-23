package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.ContentDTO;
import dev.ctrlspace.gendox.integrations.gendoxnative.services.GendoxNativeIntegrationService;
import dev.ctrlspace.gendox.provenAi.utils.MockUniqueIdentifierServiceAdapter;
import dev.ctrlspace.gendox.provenAi.utils.UniqueIdentifierCodeResponse;
import dev.ctrlspace.provenai.iscc.IsccCodeResponse;
import dev.ctrlspace.provenai.iscc.IsccCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Component
public class DocumentUtils {

    @Value("${proven-ai.sdk.iscc.enabled}")
    private Boolean isccEnabled;

    private GendoxNativeIntegrationService gendoxNativeIntegrationService;
    private IsccCodeService isccCodeService;
    private MockUniqueIdentifierServiceAdapter mockUniqueIdentifierServiceAdapter;



    @Autowired
    public DocumentUtils(GendoxNativeIntegrationService gendoxNativeIntegrationService,
                         IsccCodeService isccCodeService,
                         MockUniqueIdentifierServiceAdapter mockUniqueIdentifierServiceAdapter) {
        this.gendoxNativeIntegrationService = gendoxNativeIntegrationService;
        this.isccCodeService = isccCodeService;
        this.mockUniqueIdentifierServiceAdapter = mockUniqueIdentifierServiceAdapter;
    }

    String baseUrl = "https://test.dma.com.gr/wp-json";
    String apiKey = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJDR0NpMlNTX2lQNkdGYTBKQmVqRjAxYzNpcDBTdm43d2FLMGNYQnJHR19RIn0.eyJleHAiOjE3MzI0MDE1NjgsImlhdCI6MTczMjM1ODM2OCwiYXV0aF90aW1lIjoxNzMyMzU4MzY3LCJqdGkiOiJkNDU4MjliZi03YzQ0LTRlMmQtYTZkNS1hOGMxNzk4ZGQzNTUiLCJpc3MiOiJodHRwczovL2Rldi5nZW5kb3guY3RybHNwYWNlLmRldi9pZHAvcmVhbG1zL2dlbmRveC1pZHAtZGV2IiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjEyYjYwNGQ4LTk1OTktNDk3ZS05ZDA4LTAwYjdkZmQ5ZmVkMiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImdlbmRveC1wa2NlLXB1YmxpYy1jbGllbnQtZGV2Iiwic2lkIjoiZTFhM2Y5NDgtZjkzNy00N2NkLWI2M2QtZDRhZjk4OTZhZGY3IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwczovL2Rldi5nZW5kb3guY3RybHNwYWNlLmRldiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1nZW5kb3gtaWRwLWRldiIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJBY2NvdW50IG9uZSBUZXN0QWNjb3VudCAiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZWxvbW81MDA5QGV4d2VtZS5jb20iLCJnaXZlbl9uYW1lIjoiQWNjb3VudCBvbmUiLCJmYW1pbHlfbmFtZSI6IlRlc3RBY2NvdW50ICIsImVtYWlsIjoic2Vsb21vNTAwOUBleHdlbWUuY29tIn0.g5q4vjxCo7hv-l_NIEKxetNEvny7nlzmmjWHHZDfXbFekcDLaB9qFLM9oZYDvU2FwmT9rM3lNKORp6nnVw2x6DFfecWo1m0of6Ov5md04onu5OdSvDhYHzcwjROXGX5-8zNJxi65ZIpCBXWJmZdKhAs0pIWdYB6USGFzWkfqUpqtw4UnypUgqckDFVOYLLswfY8fpGYiJnimPvwCy-DLPpVS6Ic97UgwrGSTcievQOielLUokyGGzS6igSJLw93y24ZAwEytt8whPLAeuPqPRUoNrNN2leZK2tAzrpHsso5cPb6SQ-mSGFFbHDBcbdC_1RcGbm7qsHQu_jxv37K2_Q";


    public String getApiIntegrationDocumentTitle(Long contentId) {
        ContentDTO contentDTO = gendoxNativeIntegrationService.getContentById(baseUrl, contentId, apiKey);
        return contentDTO.getTitle();
    }

    //TODO GIANNIS implement this method
    public String getISCCCodeForApiIntegrationFile() {
        return UUID.randomUUID().toString();
    }



    public String getIsccCode(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        String documentIsccCode = null;
        if (isccEnabled) {
            IsccCodeResponse isccCodeResponse = isccCodeService.getDocumentIsccCode(file, fileName);
            documentIsccCode = isccCodeResponse.getIscc();
        }

        else {
            UniqueIdentifierCodeResponse uniqueIdentifierCodeResponse = mockUniqueIdentifierServiceAdapter.getDocumentUniqueIdentifier(file, fileName);
            documentIsccCode = uniqueIdentifierCodeResponse.getUuid();
        }
        return documentIsccCode;
    }
}
