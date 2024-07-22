package dev.ctrlspace.gendox.gendoxcoreapi.discord;


import dev.ctrlspace.gendox.authentication.AuthenticationService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.post.MessageRestClient;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
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
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
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


    public List<DocumentInstanceSection> semanticSearchForQuestion(String question, String channelName, String token, String threadId) throws GendoxException {


        Message message = new Message();
        if (threadId != null) {
            message.setThreadId(UUID.fromString(threadId));
        }
        message.setValue(question);
        UUID projectId = projectRepository.findIdByName(channelName);
        message.setProjectId(projectId);

        List<DocumentInstanceSection> sectionList = findClosestSectionRestClient(token, message, projectId);

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
        completionMessageDTO.getMessage().setThreadId(completionMessageDTO.getThreadID());
        completionMessageDTO.getMessage().setProjectId(projectId);
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


    public List<DocumentInstanceSection> findClosestSectionRestClient(String token, Message message, UUID projectId) throws GendoxException {
        List<DocumentInstanceSection> sectionList = new ArrayList<>();

        var bearerHeader = httpUtils.getBearerTokenHeader(token);


        List<LinkedHashMap> documentSectionsMap = messageRestClientService.searchMessage(bearerHeader, message, projectId, 5);

        // Iterate through the LinkedHashMap objects and extract values
        for (LinkedHashMap documentSectionMap : documentSectionsMap) {
            // Create a DocumentInstanceSection and set its properties from the LinkedHashMap
            DocumentInstanceSection section = new DocumentInstanceSection();
            // Convert the String ID to UUID
            String idString = (String) documentSectionMap.get("id");
            UUID id = UUID.fromString(idString);

            section.setId(id);
            section.setSectionValue((String) documentSectionMap.get("sectionValue")); // Replace "name" with the actual key

            sectionList.add(section);
        }

        return sectionList;
    }


    public CompletionMessageDTO getCompletionSearchRestClient(String token, Message message, UUID projectId) throws GendoxException {
        CompletionMessageDTO completionMessageDTO = new CompletionMessageDTO();

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
                        .message(moderationMessage)
                        .threadID(null)
                        .sectionId(null)
                        .build();

                logger.debug("GendoxException caught: " + e.getMessage());
            } else {
                // Handle other exceptions here if needed
                throw new GendoxException("SOME_OTHER_ERROR", "Some other error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }


        logger.debug("Received completionMessageDTO for chat command");


        // Extract values and set them in the completionMessageDTO
        completionMessageDTO.setMessage(responseDTO.getMessage());
        completionMessageDTO.setSectionId(responseDTO.getSectionId());
        completionMessageDTO.setThreadID(responseDTO.getThreadID());


        return completionMessageDTO;
    }

    public String getJwtToken(String userIdentifier) throws GendoxException {

        AccessTokenResponse jwt = authenticationService.impersonateUser(userIdentifier, null);

        return jwt.getToken();

    }


}