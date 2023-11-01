package dev.ctrlspace.gendox.gendoxcoreapi.discord.utils;


import dev.ctrlspace.gendox.gendoxcoreapi.discord.ListenerService;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.constants.DiscordGendoxConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.messages.ChatGendoxMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.messages.SearchGendoxMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import net.dv8tion.jda.api.MessageBuilder;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.OptionMapping;
import net.dv8tion.jda.api.interactions.components.ActionRow;
import net.dv8tion.jda.api.interactions.components.buttons.Button;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.List;

@Component
public class CommonCommandUtility {

    Logger logger = org.slf4j.LoggerFactory.getLogger(CommonCommandUtility.class);
    private UserService userService;
    private ProjectRepository projectRepository;
    private ListenerService listenerService;
    private ChatGendoxMessage chatGendoxMessage;
    private SearchGendoxMessage searchGendoxMessage;

    @Autowired
    public CommonCommandUtility(UserService userService,
                                ProjectRepository projectRepository,
                                ListenerService listenerService,
                                ChatGendoxMessage chatGendoxMessage,
                                SearchGendoxMessage searchGendoxMessage) {
        this.userService = userService;
        this.projectRepository = projectRepository;
        this.listenerService = listenerService;
        this.chatGendoxMessage = chatGendoxMessage;
        this.searchGendoxMessage = searchGendoxMessage;
    }


    public void executeCommandCode(SlashCommandInteractionEvent event, String command, String threadId) {
        if (event.getUser().isBot()) return;

        try {
            // Take channel and channel's name
            String channelName = event.getChannel().getName();
            String channelId = event.getChannel().getId();
            TextChannel channel = event.getJDA().getTextChannelById(channelId);
            String authorName = event.getUser().getName();

            // check if author is gendox user and if not, create new user
            if (event.getUser().isBot()) return;
            try {
                if (!userService.isUserExistByUserName(authorName)) {
                    userService.createDiscordUser(authorName);
                }
            } catch (GendoxException e) {
                logger.error("An An error occurred while checking/creating the user: " + e.getMessage());
                throw new RuntimeException(e);
            }

            // check if channel's name is equals project's name
            UUID projectId = projectRepository.findIdByName(channelName);
            if (projectId == null) {
                return;
            }

            String jwtToken = listenerService.getJwtToken(authorName);


            // Get the message content from the event
            String question = getTheQuestion(event);
            channel.sendMessage(authorName + ", thank you for the question: \n- " + question + "\n\uD83E\uDD16 Thinking... \uD83E\uDD16").queue();

            if (command.equals(DiscordGendoxConstants.CHAT_GENDOX)) {
                CompletionMessageDTO completionMessageDTO = listenerService.completionForQuestion(question, channelName, jwtToken, threadId);
                chatGendoxMessage.chatMessage(channel, completionMessageDTO);
                replyButton(channel);
            } else if (command.equals(DiscordGendoxConstants.SEARCH_GENDOX)) {
                List<DocumentInstanceSection> documentInstanceSections = listenerService.semanticSearchForQuestion(question, channelName, jwtToken, threadId);
                searchGendoxMessage.searchMessage(channel, documentInstanceSections, projectId);
            } else if (command.equals(DiscordGendoxConstants.REPLY_GENDOX)) {
                CompletionMessageDTO completionMessageDTO = listenerService.completionForQuestion(question, channelName, jwtToken, threadId);
                chatGendoxMessage.chatMessage(channel, completionMessageDTO);
            } else {
                new GendoxException("COMMAND_NOT_EXIST", "This command is not exists", HttpStatus.BAD_REQUEST);
            }

        } catch (GendoxException e) {
            logger.error("An arithmetic exception occurred: " + e.getMessage());
            throw new RuntimeException(e);
        }
    }


    public void replyButton(TextChannel channel) {
        Button replayButton = Button.primary("reply-button", "reply");

        MessageBuilder messageBuilder = new MessageBuilder()
                .setContent("Reply answer:")
                .setActionRows(ActionRow.of(replayButton));
        Message replayMessage = messageBuilder.build();


        channel.sendMessage(replayMessage).queue();
    }

    public String getTheQuestion(SlashCommandInteractionEvent event) {
        // Get the message content from the event
        OptionMapping eventQuestion = event.getOption("question");
        if (eventQuestion == null) {
            event.reply("Please provide the question").queue();
        }
        String question = eventQuestion.getAsString();

        return question;
    }
}