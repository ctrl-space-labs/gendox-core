package dev.ctrlspace.gendox.gendoxcoreapi.discord;

import dev.ctrlspace.gendox.gendoxcoreapi.controller.EmbeddingsController;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.MessageEmbed;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.OptionMapping;
import org.apache.commons.text.StringSubstitutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class ListenerService {

    Logger logger = LoggerFactory.getLogger(ListenerService.class);

    @Value("${gendox.domain.sections}")
    private String domain;

    @Value("${gendox.domain.base-url}")
    private String baseUrl;

    @Value("${server.servlet.context-path}")
    private String contextPath;
    @Value("${gendox.domain.document-sections.get-document-sections}")
    private String sectionByIdPath;


    private static final RestTemplate restTemplate = new RestTemplate();
    private ProjectRepository projectRepository;
    private DocumentInstanceRepository documentInstanceRepository;



    @Autowired
    public ListenerService(ProjectRepository projectRepository,
                           DocumentInstanceRepository documentInstanceRepository
    ) {
        this.projectRepository = projectRepository;
        this.documentInstanceRepository = documentInstanceRepository;
    }


    public List<MessageEmbed> semanticSearchForQuestion(SlashCommandInteractionEvent event, String channelName, String token) throws GendoxException {

        // Get the message content from the event
        String question = getTheQuestion(event);
        Message message = new Message();
        message.setValue(question);
        UUID projectId = projectRepository.findIdByName(channelName);

        List<DocumentInstanceSection> sectionList = findClosestSectionWithHttpRequest(token, message, projectId);

        // Make the EmbedBuilders
        List<MessageEmbed> messageEmbeds = new ArrayList<>();
        int count = 0;
        for (DocumentInstanceSection section : sectionList) {

            count++;
            MessageEmbed embedMessage = generateSectionMessageEmbed(section, projectId, count);

            messageEmbeds.add(embedMessage);

        }

        // Return List of EmbedBuilders
        return messageEmbeds;
    }

    public List<MessageEmbed> completionForQuestion(SlashCommandInteractionEvent event, String channelName, String token) throws GendoxException {

        // Get the message content from the event
        String question = getTheQuestion(event);
        Message message = new Message();
        message.setValue(question);
        UUID projectId = projectRepository.findIdByName(channelName);

        CompletionMessageDTO completionMessageDTO = getCompletionSearchWithHttpRequest(token, message, projectId);

        List<MessageEmbed> messageEmbeds = generateCompletionMessageEmbed(completionMessageDTO);


        // Return List of EmbedBuilders
        return messageEmbeds;
    }

    private List<MessageEmbed> generateCompletionMessageEmbed(CompletionMessageDTO completionMessageDTO) {

        List<String> answers = splitTextToStringsOfMaxLength(completionMessageDTO.getMessage().getValue(), 1900);

        String pathTemplate = new StringBuilder()
                .append("<")
                .append(baseUrl)
                .append(contextPath)
                .append(sectionByIdPath)
                .append("/${id}")
                .append(">")
                .toString();
        Map<String, String> sectionIdMap = new HashMap<>();
        List<String> sourcesUrls = completionMessageDTO.getSectionId().stream()
                .map(sectionId -> {
                    sectionIdMap.put("id", sectionId.toString());
                    return StringSubstitutor.replace(pathTemplate, sectionIdMap);
                })
                .toList();


        List<MessageEmbed> messageEmbeds = answers.stream().map(answer -> {
                    EmbedBuilder builder = new EmbedBuilder();
                    builder.setTitle("Gendox AI Agent");
                    builder.setDescription("```" + answer + "```");
                    builder.setColor(Color.blue);
                    sourcesUrls.forEach(url -> builder.addField("Link: ", url, true));

                    return builder.build();
                })
                .collect(Collectors.toList());


        return messageEmbeds;
    }


    //TODO move this to a Converter, its ok to have more than one params
    private MessageEmbed generateSectionMessageEmbed(DocumentInstanceSection section, UUID projectId, int count) {
        // Make new List with strings under 1900 characters by every sections value
        List<String> answers = splitTextToStringsOfMaxLength(section.getSectionValue(), 1900);

        // Find sections document name
        String documentName = getDocumentName(section.getId());
        String finalUrl = "<" + domain + projectId + ">";
        String finalAnswer = "";
        // TODO what is this? why are you adding the answers to a string? since we already split them?
        for (String answer : answers) {
            finalAnswer = finalAnswer + answer;
        }


        EmbedBuilder builder = new EmbedBuilder();
        builder.setTitle(count + ")  Document:  **" + documentName + "**");
        builder.setDescription("```" + finalAnswer + "```");
        builder.setColor(Color.blue);
        builder.addField("Link: ", finalUrl, true);

        MessageEmbed embedMessage = builder.build();
        return embedMessage;
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

    public String getTheQuestion(SlashCommandInteractionEvent event) {
        // Get the message content from the event
        OptionMapping eventQuestion = event.getOption("question");
        String question = eventQuestion.getAsString();

        return question;
    }


    public List<DocumentInstanceSection> findClosestSectionWithHttpRequest(String token, Message message, UUID projectId) throws GendoxException {
        List<DocumentInstanceSection> sectionList = new ArrayList<>();
        // Prepare the HTTP headers with the bearer token
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);


        // Prepare the request entity with the message and headers
        HttpEntity<Message> requestEntity = new HttpEntity<>(message, headers);

        // Create a RestTemplate

        String url = "http://localhost:8080/gendox/api/v1/messages/semantic-search?projectId=" + projectId.toString() + "&page=0&size=5";


        ResponseEntity<List<LinkedHashMap>> responseEntity;
        try {
            ParameterizedTypeReference<List<LinkedHashMap>> responseType = new ParameterizedTypeReference<List<LinkedHashMap>>() {
            };
            responseEntity = restTemplate.exchange(url, HttpMethod.POST, requestEntity, responseType);
        } catch (RestClientException e) {
            // Handle any exceptions that occur during the request.
            logger.error("Error sending HTTP request: " + e.getMessage(), e);
            throw new GendoxException("ERROR_SENDING_REQUEST", "Error sending HTTP request", HttpStatus.BAD_REQUEST);
        }

        // Check if the request was successful
        if (responseEntity.getStatusCode() == HttpStatus.OK) {
            List<LinkedHashMap> linkedHashMapList = responseEntity.getBody();


            // Iterate through the LinkedHashMap objects and extract values
            for (LinkedHashMap linkedHashMap : linkedHashMapList) {
                // Create a DocumentInstanceSection and set its properties from the LinkedHashMap
                DocumentInstanceSection section = new DocumentInstanceSection();
                // Convert the String ID to UUID
                String idString = (String) linkedHashMap.get("id");
                UUID id = UUID.fromString(idString);

                section.setId(id);
                section.setSectionValue((String) linkedHashMap.get("sectionValue")); // Replace "name" with the actual key

                sectionList.add(section);
            }
        } else {
            // Handle the error case, e.g., throw an exception or return an error response
            throw new GendoxException("REQUEST_FAILED", "Request to /messages/semantic-search failed with status code: " + responseEntity.getStatusCode(), HttpStatus.BAD_REQUEST);
        }

        return sectionList;
    }

    public CompletionMessageDTO getCompletionSearchWithHttpRequest(String token, Message message, UUID projectId) throws GendoxException {
        CompletionMessageDTO completionMessageDTO = new CompletionMessageDTO();
        // Prepare the HTTP headers with the bearer token
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        // Prepare the request entity with the message and headers
        HttpEntity<Message> requestEntity = new HttpEntity<>(message, headers);

        // Create a RestTemplate

        String url = "http://localhost:8080/gendox/api/v1/messages/semantic-completion?projectId=" + projectId.toString() + "&page=0&size=5";

        ResponseEntity<CompletionMessageDTO> responseEntity;
        try {
            ParameterizedTypeReference<CompletionMessageDTO> responseType = new ParameterizedTypeReference<CompletionMessageDTO>() {
            };
            responseEntity = restTemplate.exchange(url, HttpMethod.POST, requestEntity, responseType);
        } catch (RestClientException e) {
            // Handle any exceptions that occur during the request.
            logger.error("Error sending HTTP request: " + e.getMessage(), e);
            throw new GendoxException("ERROR_SENDING_REQUEST", "Error sending HTTP request", HttpStatus.BAD_REQUEST);
        }

        // Check if the request was successful
        if (responseEntity.getStatusCode() == HttpStatus.OK) {
            CompletionMessageDTO responseDTO = responseEntity.getBody();


            // Extract values and set them in the completionMessageDTO
            completionMessageDTO.setMessage(responseDTO.getMessage());
            completionMessageDTO.setSectionId(responseDTO.getSectionId());

        } else {
            // Handle the error case, e.g., throw an exception or return an error response
            throw new GendoxException("REQUEST_FAILED", "Request to /messages/semantic-search failed with status code: " + responseEntity.getStatusCode(), HttpStatus.BAD_REQUEST);
        }

        return completionMessageDTO;
    }



}