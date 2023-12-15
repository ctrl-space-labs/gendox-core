package dev.ctrlspace.gendox.gendoxcoreapi.discord.utils;


import dev.ctrlspace.gendox.authentication.AuthenticationService;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.ListenerService;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.constants.DiscordGendoxConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.messages.ChatGendoxMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.messages.SearchGendoxMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
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
import org.springframework.scheduling.annotation.Async;
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
    private AuthenticationService authenticationService;

    @Autowired
    public CommonCommandUtility(UserService userService,
                                ProjectRepository projectRepository,
                                ListenerService listenerService,
                                ChatGendoxMessage chatGendoxMessage,
                                SearchGendoxMessage searchGendoxMessage,
                                AuthenticationService authenticationService) {
        this.userService = userService;
        this.projectRepository = projectRepository;
        this.listenerService = listenerService;
        this.chatGendoxMessage = chatGendoxMessage;
        this.searchGendoxMessage = searchGendoxMessage;
        this.authenticationService = authenticationService;
    }


    @Async("asyncDiscordExecutor")
    @Observed(name = "discord.commands.asyncDiscordExecutor",
            contextualName = "discord-commands-asyncDiscordExecutor",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_DEBUG,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public void executeCommandCode(SlashCommandInteractionEvent event, String command, String threadId) {
        if (event.getUser().isBot()) return;

        logger.info("Start execute command: " + command);
        try {
            // Take channel and channel's name
            String channelName = event.getChannel().getName();
            String channelId = event.getChannel().getId();
            TextChannel channel = event.getJDA().getTextChannelById(channelId);
            String authorName = event.getUser().getName();
            User user = userService.getByUsername(authorName);

            // check if author is gendox user and if not, create new user
            if (event.getUser().isBot()) return;
            try {
                if (user == null) {
                    user = userService.createDiscordUser(authorName);
                }
            } catch (GendoxException e) {
                logger.error("An error occurred while checking/creating the user: " + e.getMessage());
                throw new RuntimeException(e);
            }

            // check if identifier user exist and if no create identifier user
            try {
                if (authenticationService.getUsersByUsername(authorName).isEmpty()) {
                    authenticationService.createUser(user, null, true, false);
                }
            } catch (GendoxException e) {
                logger.error("An error occurred while checking/creating user's identifier: " + e.getMessage());
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
                logger.debug("Received completionForQuestion for chat command");
                chatGendoxMessage.chatMessage(channel, completionMessageDTO);
                logger.debug("Received chatMessage");
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