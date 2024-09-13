package dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.messages;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.ListenerService;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.constants.DiscordGendoxConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.MessageBuilder;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.MessageEmbed;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.interactions.components.ActionRow;
import net.dv8tion.jda.api.interactions.components.buttons.Button;
import org.apache.commons.text.StringSubstitutor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.awt.*;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ChatGendoxMessage {

    @Value("${gendox.domain.base-url}")
    private String baseUrl;
    @Value("${server.servlet.context-path}")
    private String contextPath;
    @Value("${gendox.domain.document-sections.get-document-sections}")
    private String sectionByIdPath;

    private ListenerService listenerService;

    @Autowired
    public ChatGendoxMessage(ListenerService listenerService) {
        this.listenerService = listenerService;
    }


    public void chatMessage(TextChannel channel, CompletionMessageDTO completionMessageDTO) throws GendoxException {

        List<String> answers = listenerService.splitTextToStringsOfMaxLength(completionMessageDTO.getMessage().getValue(), 1900);

        String pathTemplate = new StringBuilder()
//                .append("<")
                .append(baseUrl)
                .append(contextPath)
                .append(sectionByIdPath)
                .append("/${id}")
//                .append(">")
                .toString();

        EmbedBuilder builder = new EmbedBuilder();
        builder.setTitle(DiscordGendoxConstants.MESSAGE_TITLE);
        builder.setColor(Color.blue);
        for (String answer : answers) {
            builder.appendDescription("```").appendDescription(answer).appendDescription("```");
        }
        if (completionMessageDTO.getThreadID() != null) {
            builder.addField("thread: ", completionMessageDTO.getThreadID().toString(), true);
        }
        MessageEmbed messageEmbed = builder.build(); // Build the MessageEmbed
        MessageBuilder messageBuilder = new MessageBuilder()
                .setEmbeds(messageEmbed);

        if (completionMessageDTO.getMessage().getMessageSections() != null) {
            List<UUID> sectionIds = completionMessageDTO.getMessage().getMessageSections().stream()
                    .map(MessageSection::getSectionId)
                    .toList();

            // return message if pass the moderation check
            if (!sectionIds.isEmpty()) {
                Map<String, String> sectionIdMap = new HashMap<>();
                List<String> sourcesUrls = sectionIds.stream()
                        .map(sectionId -> {
                            sectionIdMap.put("id", sectionId.toString());
                            return StringSubstitutor.replace(pathTemplate, sectionIdMap);
                        })
                        .toList();
                List<Button> linkButtons = new ArrayList<>();
                for (int i = 0; i < sourcesUrls.size(); i++) {
                    linkButtons.add(Button.link(sourcesUrls.get(i), "Link " + (i + 1)));
                }
                messageBuilder.setActionRows(ActionRow.of(linkButtons.toArray(new Button[0])));
            }
        }


        Message message = messageBuilder.build();
        channel.sendMessage(message).queue();


    }
}
