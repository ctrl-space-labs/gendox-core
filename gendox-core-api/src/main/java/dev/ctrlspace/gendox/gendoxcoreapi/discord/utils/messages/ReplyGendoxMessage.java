package dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.messages;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.ListenerService;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.constants.DiscordGendoxConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import net.dv8tion.jda.api.entities.MessageEmbed;
import net.dv8tion.jda.api.entities.TextChannel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ReplyGendoxMessage {

    private ListenerService listenerService;
    private ChatGendoxMessage chatGendoxMessage;

    @Autowired
    public ReplyGendoxMessage(ListenerService listenerService,
                              ChatGendoxMessage chatGendoxMessage){
        this.listenerService = listenerService;
        this.chatGendoxMessage = chatGendoxMessage;
    }

    public void replyMessage(MessageEmbed messageEmbed, String messageContent, String authorName, TextChannel channel) throws GendoxException{


            String jwtToken = listenerService.getJwtToken(authorName);

            // if user reply gendox message
            if (messageEmbed.getTitle().equals(DiscordGendoxConstants.MESSAGE_TITLE)) {
                messageContent = messageContent + " reply question for the ai model's answer: "+ messageEmbed.getDescription();
                String threadId = messageEmbed.getFields().get(0).getValue();

                CompletionMessageDTO completionMessageDTO = listenerService.completionForQuestion(messageContent, channel.getName(), jwtToken, threadId);
                chatGendoxMessage.chatMessage(channel, completionMessageDTO);
                return;
            } // if user didn't reply gendox message
            String responseMessage = authorName + " You must reply on Gendox message";
            channel.sendMessage(responseMessage).queue();

    }
}
