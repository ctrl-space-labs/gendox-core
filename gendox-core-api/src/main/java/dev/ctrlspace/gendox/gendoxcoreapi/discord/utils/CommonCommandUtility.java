package dev.ctrlspace.gendox.gendoxcoreapi.discord.utils;


import dev.ctrlspace.gendox.authentication.AuthenticationService;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.ListenerService;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.constants.DiscordGendoxConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.messages.ChatGendoxMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.messages.SearchGendoxMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectMemberService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserOrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.OrganizationRolesConstants;
import io.micrometer.observation.annotation.Observed;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.OptionMapping;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

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
    private ProjectMemberService projectMemberService;
    private UserOrganizationService userOrganizationService;

    @Autowired
    public CommonCommandUtility(UserService userService,
                                ProjectRepository projectRepository,
                                ListenerService listenerService,
                                ChatGendoxMessage chatGendoxMessage,
                                SearchGendoxMessage searchGendoxMessage,
                                AuthenticationService authenticationService,
                                ProjectMemberService projectMemberService,
                                UserOrganizationService userOrganizationService) {
        this.userService = userService;
        this.projectRepository = projectRepository;
        this.listenerService = listenerService;
        this.chatGendoxMessage = chatGendoxMessage;
        this.searchGendoxMessage = searchGendoxMessage;
        this.authenticationService = authenticationService;
        this.projectMemberService = projectMemberService;
        this.userOrganizationService = userOrganizationService;
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
        // Ignore if the event user is a bot
        if (event.getUser().isBot()) return;

        // Log the start of command execution
        logger.debug("Start execute command: " + command);
        try {
            // Extract channel information and user details from the event
            String channelName = event.getChannel().getName();
            String channelId = event.getChannel().getId();
            TextChannel channel = event.getJDA().getTextChannelById(channelId);
            String authorName = event.getUser().getName();
            Project project = projectRepository.findByName(channelName);
            User user = userService
                    .getOptionalUserByUniqueIdentifier(authorName)
                    .orElse(null);

            // Check if the event user is a bot or if the project ID is null
            if (event.getUser().isBot() || project.getId() == null) return;

            // If the user does not exist, create a new user
            if (user == null) {
                user = userService.createDiscordUser(authorName);
            }

            // If the identifier user does not exist, create one
            if (authenticationService.getUsersByUsername(authorName).isEmpty()) {
                authenticationService.createUser(user, null, true, false);
            }

            // If the user is not a project member, add them to the project
            if (!projectMemberService.isUserProjectMember(project.getId(), user.getId())) {
                projectMemberService.createProjectMember(user.getId(), project.getId());
            }

            // If the user is not a member of the organization, add them with reader role
            if (!userOrganizationService.isUserOrganizationMember(user.getId(), project.getOrganizationId())) {
                userOrganizationService.createUserOrganization(user.getId(), project.getOrganizationId(), OrganizationRolesConstants.READER);
            }

            // Retrieve JWT token for the user
            String jwtToken = listenerService.getJwtToken(authorName);

            // Get the message content from the event
            String question = getTheQuestion(event);
            channel.sendMessage(authorName + ", thank you for the question: \n- " + question + "\n\uD83E\uDD16 Thinking... \uD83E\uDD16").queue();

            // Perform actions based on the command type
            if (command.equals(DiscordGendoxConstants.CHAT_GENDOX)) {
                CompletionMessageDTO completionMessageDTO = listenerService.completionForQuestion(question, channelName, jwtToken, threadId);
                logger.debug("Received completionForQuestion for chat command");
                chatGendoxMessage.chatMessage(channel, completionMessageDTO);
                logger.debug("Received chatMessage");
            } else if (command.equals(DiscordGendoxConstants.SEARCH_GENDOX)) {
                List<DocumentInstanceSection> documentInstanceSections = listenerService.semanticSearchForQuestion(question, channelName, jwtToken, threadId);
                searchGendoxMessage.searchMessage(channel, documentInstanceSections, project.getId());
            } else if (command.equals(DiscordGendoxConstants.REPLY_GENDOX)) {
                CompletionMessageDTO completionMessageDTO = listenerService.completionForQuestion(question, channelName, jwtToken, threadId);
                chatGendoxMessage.chatMessage(channel, completionMessageDTO);
            } else {
                new GendoxException("COMMAND_NOT_EXIST", "This command is not exists", HttpStatus.BAD_REQUEST);
            }

        } catch (GendoxException e) {
            logger.error("An error occurred: " + e.getMessage());
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