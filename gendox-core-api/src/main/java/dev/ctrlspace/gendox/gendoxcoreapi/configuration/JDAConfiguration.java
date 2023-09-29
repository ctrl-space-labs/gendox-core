package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.Listener;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.ListenerService;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.commands.AskGendox;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.commands.ChatWithBot;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.commands.CommandManager;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.commands.Embed;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
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
    public JDA jda(List<Listener> listeners, AskGendox askGendox) throws LoginException {
        JDA jda = JDABuilder
                .createDefault(token)
                .enableIntents(GatewayIntent.MESSAGE_CONTENT, GatewayIntent.GUILD_MESSAGES, GatewayIntent.GUILD_MESSAGE_TYPING)
                .build();
        for (Listener listener : listeners) {
            jda.addEventListener(listener);
        }

        // Commands
        CommandManager manager = new CommandManager();
        manager.add(new Embed());
        manager.add(new ChatWithBot());
        manager.add(askGendox);
        jda.addEventListener(manager);
        return jda;
    }


}
