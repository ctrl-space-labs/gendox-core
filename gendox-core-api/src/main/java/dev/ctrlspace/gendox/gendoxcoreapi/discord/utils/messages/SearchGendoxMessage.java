package dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.messages;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.ListenerService;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.MessageEmbed;
import net.dv8tion.jda.api.entities.TextChannel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.awt.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class SearchGendoxMessage {

    @Value("${gendox.domain.sections}")
    private String domain;


    private ListenerService listenerService;

    @Autowired
    public SearchGendoxMessage(ListenerService listenerService){
        this.listenerService = listenerService;
    }

    public void searchMessage(TextChannel channel, List<DocumentInstanceSection> sectionList, UUID projectId){


        // Make the EmbedBuilders
        List<MessageEmbed> messageEmbeds = new ArrayList<>();
        int count = 0;
        for (DocumentInstanceSection section : sectionList) {
            count++;
            // Make new List with strings under 1900 characters by every sections value
            List<String> answers = listenerService.splitTextToStringsOfMaxLength(section.getSectionValue(), 1900);

            // Find sections document name
            String documentName = listenerService.getDocumentName(section.getId());
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

            messageEmbeds.add(embedMessage);
        }

        for (MessageEmbed messageEmbed : messageEmbeds) {
            channel.sendMessageEmbeds(messageEmbed).queue();
        }
    }


}
