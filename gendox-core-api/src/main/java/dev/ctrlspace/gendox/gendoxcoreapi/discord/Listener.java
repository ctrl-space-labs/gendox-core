package dev.ctrlspace.gendox.gendoxcoreapi.discord;


import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.messages.ChatGendoxMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.constants.DiscordGendoxConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.messages.ReplyGendoxMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import net.dv8tion.jda.api.entities.Category;
import net.dv8tion.jda.api.entities.MessageEmbed;
import net.dv8tion.jda.api.entities.TextChannel;

import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;

import javax.annotation.Nonnull;


@Controller
public class Listener extends ListenerAdapter {

    Logger logger = LoggerFactory.getLogger(Listener.class);

    @Value("${discord.server.group-name}")
    private String gendox_group;


    private ReplyGendoxMessage replyGendoxMessage;


    @Autowired
    public Listener(ReplyGendoxMessage replyGendoxMessage) {
        this.replyGendoxMessage = replyGendoxMessage;
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


        // check if the event is on the correct group in Discord's server
        if (!gendox_group.equals(categoryName)) {
            return;
        }

        String messageContent = event.getMessage().getContentRaw();

        logger.debug("Received message");

        // if user's message is reply
        if (event.getMessage().getReferencedMessage() != null) {
            logger.debug("Received user's reply");
            MessageEmbed messageEmbed = event.getMessage().getReferencedMessage().getEmbeds().get(0);
            try {
                replyGendoxMessage.replyMessage(messageEmbed, messageContent, authorName, channel);
                return;
            } catch (GendoxException e) {
                logger.error("An An error occurred while checking/creating the user: " + e.getMessage());
                throw new RuntimeException(e);
            }

        }


        // Check if the message content looks like a question
        if (event.getAuthor().isBot()) return;
        if (messageContent.startsWith("/chat")) {
            return;
        } else if (messageContent.endsWith("?")) {
            // Respond to questions ending with a question mark
            String responseMessage = authorName + " asked a question in #" + channelName + ": " + messageContent + "\n You must using the **/chat or /search** commands";
            channel.sendMessage(responseMessage).queue();
        } else if (messageContent.contains("help")) {
            // Respond to messages containing the word "help"
            String responseMessage = authorName + ", if you need assistance, feel free to ask using the **/chat** command!";
            channel.sendMessage(responseMessage).queue();
        } else if (messageContent.contains("hello") || messageContent.contains("hi")) {
            // Respond to messages containing greetings
            String responseMessage = "Hello, " + authorName + "! How can I assist you today?";
            channel.sendMessage(responseMessage).queue();
        } else {
            // Respond with a default message for other messages
            String responseMessage = "I'm here to assist with questions. If you have any questions, just ask using the **/chat** command!";
            channel.sendMessage(responseMessage).queue();
        }
    }


}


