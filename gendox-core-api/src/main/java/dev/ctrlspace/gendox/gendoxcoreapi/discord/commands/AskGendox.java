package dev.ctrlspace.gendox.gendoxcoreapi.discord.commands;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.ListenerService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.MessageEmbed;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.OptionType;
import net.dv8tion.jda.api.interactions.commands.build.OptionData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


@Component
public class AskGendox implements ICommand {

    private ListenerService listenerService;
    private ProjectRepository projectRepository;

    @Autowired
    public AskGendox(ListenerService listenerService,
                     ProjectRepository projectRepository) {
        this.listenerService = listenerService;
        this.projectRepository = projectRepository;
    }

    @Override
    public String getName() {
        return "ask";
    }

    @Override
    public String getDescription() {
        return "Perform Semantic Search to the Knowledge Base";
    }

    @Override
    public List<OptionData> getOptions() {
        List<OptionData> data = new ArrayList<>();
        data.add(new OptionData(
                OptionType.STRING,
                "question",
                "Ask Gendox",
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

            UUID projectId = projectRepository.findIdByName(channelName);
            if (projectId == null) {
                return;
            }


            List<MessageEmbed> messageEmbeds = listenerService.semanticSearchForQuestion(event, channelName);

            // Get the message content from the event
            String question = listenerService.getTheQuestion(event);
            channel.sendMessage(authorName + ", thank you for the question: \n- " + question).queue();

            for (MessageEmbed messageEmbed : messageEmbeds) {
                channel.sendMessageEmbeds(messageEmbed).queue();
            }


        } catch (GendoxException e) {
            System.err.println("An arithmetic exception occurred: " + e.getMessage());
        }
    }
}
















