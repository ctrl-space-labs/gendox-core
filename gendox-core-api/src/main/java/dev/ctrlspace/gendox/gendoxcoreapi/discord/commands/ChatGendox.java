package dev.ctrlspace.gendox.gendoxcoreapi.discord.commands;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.Listener;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.ListenerService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import net.dv8tion.jda.api.entities.MessageEmbed;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.OptionType;
import net.dv8tion.jda.api.interactions.commands.build.OptionData;
import net.dv8tion.jda.api.interactions.components.buttons.Button;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.stereotype.Component;


import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class ChatGendox implements ICommand {

    Logger logger = org.slf4j.LoggerFactory.getLogger(ChatGendox.class);

    private ListenerService listenerService;
    private ProjectRepository projectRepository;
    private Listener listener;
    private JwtEncoder jwtEncoder;

    @Autowired
    public ChatGendox(ListenerService listenerService,
                      Listener listener,
                      ProjectRepository projectRepository,
                      JwtEncoder jwtEncoder) {
        this.listenerService = listenerService;
        this.listener = listener;
        this.projectRepository = projectRepository;
        this.jwtEncoder = jwtEncoder;
    }

    @Override
    public String getName() {
        return "chat";
    }

    @Override
    public String getDescription() {
        return "Chat with Gendox AI Agent";
    }

    @Override
    public List<OptionData> getOptions() {
        List<OptionData> data = new ArrayList<>();
        data.add(new OptionData(
                OptionType.STRING,
                "question",
                "Chat with Gendox AI Agent",
                true));
        return data;
    }

    @Override
    public void execute(SlashCommandInteractionEvent event) {
        if (event.getUser().isBot()) return;

        try {
            // Take channel and channel's name
            String channelName = event.getChannel().getName();
            String channelId = event.getChannel().getId();
            TextChannel channel = event.getJDA().getTextChannelById(channelId);
            String authorName = event.getUser().getName();
            String jwtToken = listener.getJwtToken(authorName);;


            UUID projectId = projectRepository.findIdByName(channelName);
            if (projectId == null) {
                return;
            }
            // Get the message content from the event
            String question = listenerService.getTheQuestion(event);
            channel.sendMessage(authorName + ", thank you for the question: \n- " + question + "\n\uD83E\uDD16 Thinking... \uD83E\uDD16").queue();



            List<MessageEmbed> messageEmbeds = listenerService.  completionForQuestion(event, channelName, jwtToken);


//            Button replayButton = Button.danger("replay-button", "replay");
//            Button button = Button.primary("replay-button", "replay").withLabel().

            for (MessageEmbed messageEmbed : messageEmbeds) {
                channel.sendMessageEmbeds(messageEmbed).queue();
            }


        } catch (GendoxException e) {
            logger.error("An arithmetic exception occurred: " + e.getMessage());
            throw new RuntimeException(e);
        }

    }
}
