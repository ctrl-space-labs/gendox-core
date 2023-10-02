package dev.ctrlspace.gendox.gendoxcoreapi.discord;

import dev.ctrlspace.gendox.gendoxcoreapi.configuration.JDAConfiguration;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.Category;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Message;
import net.dv8tion.jda.api.entities.TextChannel;

import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;

import java.net.URL;

import java.awt.*;
import java.util.List;
import java.util.UUID;

@Controller
public class Listener extends ListenerAdapter {

    @Value("${discord.server.group-name}")
    private String gendox_group;

    private JDAConfiguration jdaConfiguration;
    private ListenerService listenerService;
    private ProjectRepository projectRepository;


    @Autowired
    public Listener(JDAConfiguration jdaConfiguration,
                    ListenerService listenerService,
                    ProjectRepository projectRepository) {
        this.jdaConfiguration = jdaConfiguration;
        this.listenerService = listenerService;
        this.projectRepository = projectRepository;
    }


    @Override
    public void onMessageReceived(@NotNull MessageReceivedEvent event) {
        // Take channel and channel's name
        String channelName = event.getChannel().getName();
        String channelId = event.getChannel().getId();
        TextChannel channel = event.getJDA().getTextChannelById(channelId);
        String authorName = event.getAuthor().getName();

        // Get the category of the channel
        Category category = channel.getParentCategory(); // This will give you the category associated with the channel

        // Check if the category is not null and then get its name
        String categoryName = (category != null) ? category.getName() : "No Category"; // You can change "No Category" to a default value if needed


        // check if the event is on the gendox group
        if (!gendox_group.equals(categoryName)){
            return;
        }

        // Check if the message content is a question (you can define your criteria)
        String messageContent = event.getMessage().getContentRaw();


        // Check if the message content looks like a question
        if (event.getAuthor().isBot()) return;
        if (messageContent.startsWith("/ask")) {
            return;
        } else if (messageContent.endsWith("?")) {
            // Respond to questions ending with a question mark
            String responseMessage = authorName + " asked a question in #" + channelName + ": " + messageContent + "\n You must using the **/ask** command";
            channel.sendMessage(responseMessage).queue();
        } else if (messageContent.contains("help")) {
            // Respond to messages containing the word "help"
            String responseMessage = authorName + ", if you need assistance, feel free to ask using the **/ask** command!";
            channel.sendMessage(responseMessage).queue();
        } else if (messageContent.contains("hello") || messageContent.contains("hi")) {
            // Respond to messages containing greetings
            String responseMessage = "Hello, " + authorName + "! How can I assist you today?";
            channel.sendMessage(responseMessage).queue();
        } else {
            // Respond with a default message for other messages
            String responseMessage = "I'm here to assist with questions. If you have any questions, just ask using the **/ask** command!";
            channel.sendMessage(responseMessage).queue();
        }
    }

}


