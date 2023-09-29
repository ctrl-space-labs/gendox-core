package dev.ctrlspace.gendox.gendoxcoreapi.discord;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.dv8tion.jda.api.interactions.commands.OptionMapping;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.util.ArrayList;
import java.util.EventListener;
import java.util.List;
import java.util.UUID;


@Service
public class ListenerService {

    @Value("${gendox.domain.sections}")
    private String domain;

    private EmbeddingService embeddingService;

    private ProjectRepository projectRepository;
    private DocumentInstanceRepository documentInstanceRepository;


    @Autowired
    public ListenerService(EmbeddingService embeddingService,
                           ProjectRepository projectRepository,
                           DocumentInstanceRepository documentInstanceRepository) {
        this.embeddingService = embeddingService;
        this.projectRepository = projectRepository;
        this.documentInstanceRepository = documentInstanceRepository;

    }


    public List<EmbedBuilder> getEmbedBuilders(SlashCommandInteractionEvent event, String channelName) throws GendoxException {

        // Get the message content from the event
        String question = getTheQuestion(event);


        // Find projectID
        UUID projectId = projectRepository.findIdByName(channelName);


        // Create message for the question
        Message message = new Message();
        message.setValue(question);
        message = embeddingService.createMessage(message);

        // Take the sections
        List<DocumentInstanceSection> sectionList = embeddingService.findClosestSections(message, projectId);


        // Make the EmbedBuilders
        List<EmbedBuilder> embedBuilders = new ArrayList<>();
        int count = 0;
        for (DocumentInstanceSection section : sectionList) {
            // Make new List with strings under 1900 characters by every sections value
            List<String> answers = sectionToStringConverter(section, 1900);

            // Find sections document name
            String documentName = getDocumentName(section.getId());
            count++;
            String finalUrl = "<" + domain + projectId + ">";
            String finalAnswer = "";
            for (String answer : answers) {
                finalAnswer = finalAnswer + answer;
            }

            if (!event.getUser().isBot()) {
                EmbedBuilder builder = new EmbedBuilder();
                builder.setTitle(count + ")  Document:  **" + documentName +"**");
                builder.setDescription("```" + finalAnswer + "```");
                builder.setColor(Color.blue);
                builder.addField("Link: ", finalUrl, true);
                embedBuilders.add(builder);
            }
        }

        // Return List of EmbedBuilders
        return embedBuilders;
    }

    public List<String> sectionToStringConverter(DocumentInstanceSection section, int maxLength) {
        List<String> answers = new ArrayList<>();
        String answer = section.getSectionValue();
        int start = 0;

        while (start < answer.length()) {
            int end = Math.min(start + maxLength, answer.length());
            String chunk = answer.substring(start, end);
            answers.add(chunk);
            start = end;
        }

        return answers;
    }

    public String getDocumentName(UUID sectionId) {

        String inputString = documentInstanceRepository.findRemoteUrlBySectionId(sectionId);

        // Find the index of the first '_' character
        int firstIndexOfUnderscore = inputString.indexOf('_');

        String result = inputString.substring( + firstIndexOfUnderscore + 1 );
        return result;

    }

    public String getTheQuestion(SlashCommandInteractionEvent event) {
        // Get the message content from the event
        OptionMapping eventQuestion = event.getOption("question");
        String question = eventQuestion.getAsString();

        return question;
    }

}
