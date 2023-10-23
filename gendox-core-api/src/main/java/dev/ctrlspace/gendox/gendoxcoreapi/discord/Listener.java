package dev.ctrlspace.gendox.gendoxcoreapi.discord;


import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import net.dv8tion.jda.api.entities.Category;
import net.dv8tion.jda.api.entities.TextChannel;

import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Controller;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;



@Controller
public class Listener extends ListenerAdapter {

    Logger logger = LoggerFactory.getLogger(Listener.class);

    @Value("${discord.server.group-name}")
    private String gendox_group;


    private UserService userService;
    private JWTUtils jwtUtils;
    private JwtDTOUserProfileConverter jwtDTOUserProfileConverter;
    private JwtEncoder jwtEncoder;

    private static final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    public Listener(UserService userService,
                    JWTUtils jwtUtils,
                    JwtDTOUserProfileConverter jwtDTOUserProfileConverter,
                    JwtEncoder jwtEncoder) {
        this.userService = userService;
        this.jwtUtils = jwtUtils;
        this.jwtDTOUserProfileConverter = jwtDTOUserProfileConverter;
        this.jwtEncoder = jwtEncoder;
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

        // check if author is gendox user and if not, create new user
        if (event.getAuthor().isBot()) return;
        try {
            if (!userService.isUserExistByUserName(authorName)) {
                userService.createDiscordUser(authorName);
            }
        } catch (GendoxException e) {
           logger.warn("An An error occurred while checking/creating the user: " + e.getMessage());
        }

        // check if the event is on the gendox group
        if (!gendox_group.equals(categoryName)) {
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

    public JwtClaimsSet getJwtClaimsFromHttpRequest(String userIdentifier) throws GendoxException {


        // Build the URL for the HTTP request
        String url = "http://localhost:8080/gendox/api/v1/users/login?userIdentifier=" + userIdentifier;

        // Create HttpHeaders and HttpEntity
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);



        HttpEntity<String> httpEntity = new HttpEntity<>(headers);


        // Send the HTTP request and capture the response
        ResponseEntity<String> responseEntity;
        try {
           responseEntity = restTemplate.exchange(url, HttpMethod.GET, httpEntity, String.class);
        } catch (RestClientException e) {
            // Handle any exceptions that occur during the request.
            logger.error("Error sending HTTP request: " + e.getMessage(), e);
            throw new GendoxException("ERROR_SENDING_REQUEST","Error sending HTTP request", HttpStatus.BAD_REQUEST);
        }



        if (responseEntity.getStatusCode() == HttpStatus.OK) {

            UserProfile userProfile = userService.getUserProfileByUniqueIdentifier(userIdentifier);
            JwtDTO jwtDTO = jwtDTOUserProfileConverter.jwtDTO(userProfile);
            // Set the Authorization header with the bearer token
            JwtClaimsSet claims = jwtUtils.toClaimsSet(jwtDTO);
            String jwtToken = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
            headers.set("Authorization", "Bearer " + jwtToken);
            return claims;

        } else {
            throw new GendoxException("REQUEST_TO_LOGIN_FAILED", "Request failed with status code: " , HttpStatus.BAD_REQUEST);
        }

    }

}


