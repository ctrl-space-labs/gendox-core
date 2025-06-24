package dev.ctrlspace.gendox.gendoxcoreapi.discord;


import dev.ctrlspace.gendox.authentication.AuthenticationService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.post.MessageRestClient;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.HttpUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.keycloak.representations.AccessTokenResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;

import java.util.*;
import java.util.List;


@Service
public class ListenerService {

    @Value("${gendox.moderation.message}")
    private String moderationFlaggedMessage;

    Logger logger = LoggerFactory.getLogger(ListenerService.class);


    private ProjectRepository projectRepository;
    private DocumentInstanceRepository documentInstanceRepository;
    private HttpUtils httpUtils;
    private MessageRestClient messageRestClientService;
    private JWTUtils jwtUtils;
    private JwtDTOUserProfileConverter jwtDTOUserProfileConverter;
    private UserService userService;
    private EmbeddingService embeddingService;

    private AuthenticationService authenticationService;

    @Autowired
    public ListenerService(ProjectRepository projectRepository,
                           DocumentInstanceRepository documentInstanceRepository,
                           HttpUtils httpUtils,
                           MessageRestClient messageRestClientService,
                           JWTUtils jwtUtils,
                           JwtDTOUserProfileConverter jwtDTOUserProfileConverter,
                           UserService userService,
                           AuthenticationService authenticationService,
                           EmbeddingService embeddingService) {
        this.projectRepository = projectRepository;
        this.documentInstanceRepository = documentInstanceRepository;
        this.httpUtils = httpUtils;
        this.messageRestClientService = messageRestClientService;
        this.jwtUtils = jwtUtils;
        this.jwtDTOUserProfileConverter = jwtDTOUserProfileConverter;
        this.userService = userService;
        this.embeddingService = embeddingService;
        this.authenticationService = authenticationService;
    }


    public List<DocumentInstanceSectionDTO> semanticSearchForQuestion(String question, String channelName, String token, String threadId) throws GendoxException {


        Message message = new Message();
        if (threadId != null) {
            message.setThreadId(UUID.fromString(threadId));
        }
        message.setValue(question);
        UUID projectId = projectRepository.findIdByName(channelName);
        message.setProjectId(projectId);

        List<DocumentInstanceSectionDTO> sectionList = findClosestSectionRestClient(token, message, projectId);

        return sectionList;
    }

    public CompletionMessageDTO completionForQuestion(String question, String channelName, String token, String threadId) throws GendoxException {

        Message message = new Message();
        if (threadId != null) {
            message.setThreadId(UUID.fromString(threadId));
        }
        message.setValue(question);
        UUID projectId = projectRepository.findIdByName(channelName);
        message.setProjectId(projectId);

        CompletionMessageDTO completionMessageDTO = getCompletionSearchRestClient(token, message, projectId);
        logger.debug("Received getCompletionSearchRestClient for chat command");
        completionMessageDTO.getMessages().forEach(m -> m.setThreadId(completionMessageDTO.getThreadId()));
        //save the answer as message

        // https://github.com/ctrl-space-labs/gendox-core/issues/213
//        embeddingService.createMessage(completionMessageDTO.getMessage());


        return completionMessageDTO;
    }

    public List<String> splitTextToStringsOfMaxLength(String text, int maxLength) {
        List<String> answers = new ArrayList<>();
        int start = 0;

        while (start < text.length()) {
            int end = Math.min(start + maxLength, text.length());
            String chunk = text.substring(start, end);
            answers.add(chunk);
            start = end;
        }

        return answers;
    }

    public String getDocumentName(UUID sectionId) {

        String inputString = documentInstanceRepository.findRemoteUrlBySectionId(sectionId);

        // Find the index of the first '_' character
        int firstIndexOfUnderscore = inputString.indexOf('_');

        String result = inputString.substring(+firstIndexOfUnderscore + 1);
        return result;

    }


    public List<DocumentInstanceSectionDTO> findClosestSectionRestClient(String token, Message message, UUID projectId) throws GendoxException {
        List<DocumentInstanceSectionDTO> sectionList = new ArrayList<>();

        var bearerHeader = httpUtils.getBearerTokenHeader(token);


        List<LinkedHashMap> documentSectionsDTOMap = messageRestClientService.searchMessage(bearerHeader, message, projectId, 5);

        // Iterate through the LinkedHashMap objects and extract values
        for (LinkedHashMap documentSectionDTOMap : documentSectionsDTOMap) {
            // Create a DocumentInstanceSection and set its properties from the LinkedHashMap
            DocumentInstanceSectionDTO section = new DocumentInstanceSectionDTO();
            // Convert the String ID to UUID
            String idString = (String) documentSectionDTOMap.get("id");
            UUID id = UUID.fromString(idString);

            section.setId(id);
            section.setSectionValue((String) documentSectionDTOMap.get("sectionValue")); // Replace "name" with the actual key

            sectionList.add(section);
        }

        return sectionList;
    }


    public CompletionMessageDTO getCompletionSearchRestClient(String token, Message message, UUID projectId) throws GendoxException {

        var bearerHeader = httpUtils.getBearerTokenHeader(token);

        logger.debug("Start completionMessageDTO for chat command");
        CompletionMessageDTO responseDTO = new CompletionMessageDTO();
        try {
            responseDTO = messageRestClientService.completionMessageDTO(bearerHeader, message, projectId, 5);
        } catch (Exception e) {
            if (((HttpStatus) ((HttpClientErrorException.NotAcceptable) e).getStatusCode()).name().equals(HttpStatus.NOT_ACCEPTABLE.name())) {
                Message moderationMessage = message.toBuilder()
                        .value(moderationFlaggedMessage)
                        .build();
                responseDTO = responseDTO.toBuilder()
                        .messages(Arrays.asList(moderationMessage))
                        .threadId(null)
                        .build();

                logger.debug("GendoxException caught: " + e.getMessage());
            } else {
                // Handle other exceptions here if needed
                throw new GendoxException("SOME_OTHER_ERROR", "Some other error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }


        logger.debug("Received completionMessageDTO for chat command");


        return responseDTO;
    }

    public String getJwtToken(String userIdentifier) throws GendoxException {

        AccessTokenResponse jwt = authenticationService.impersonateUser(userIdentifier, null);

        return jwt.getToken();

    }


}