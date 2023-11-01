package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.Listener;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.commands.*;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.requests.GatewayIntent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.security.auth.login.LoginException;
import java.util.List;

@Configuration
public class JDAConfiguration {

    @Value("${discord.bots.gendox-bot.token}")
    private String token;

    @Bean
    public JDA jda(List<Listener> listeners, SearchGendox searchGendox, ChatGendox chatGendox, ReplyGendox replyGendox) throws LoginException {
        JDA jda = JDABuilder
                .createDefault(token)
                .enableIntents(GatewayIntent.MESSAGE_CONTENT, GatewayIntent.GUILD_MESSAGES, GatewayIntent.GUILD_MESSAGE_TYPING)
                .build();
        for (Listener listener : listeners) {
            jda.addEventListener(listener);
        }

        // Commands
        CommandManager manager = new CommandManager();
        manager.add(searchGendox);
        manager.add(chatGendox);
        manager.add(replyGendox);
        jda.addEventListener(manager);
        return jda;
    }


}
