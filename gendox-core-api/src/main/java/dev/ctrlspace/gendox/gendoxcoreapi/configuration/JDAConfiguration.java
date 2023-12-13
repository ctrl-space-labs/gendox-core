package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.Listener;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.commands.*;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.requests.GatewayIntent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.support.TaskExecutorAdapter;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import javax.security.auth.login.LoginException;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Configuration
@EnableAsync
public class JDAConfiguration {

    Logger logger = LoggerFactory.getLogger(JDAConfiguration.class);

    @Value("${discord.bots.gendox-bot.token}")
    private String token;


    @Bean
    public JDA jda(List<Listener> listeners, SearchGendox searchGendox, ChatGendox chatGendox, ReplyGendox replyGendox) throws LoginException {

        // Return null if token is null
        if (token == null || token.trim().isEmpty() || token.equals("default-token")) {
            logger.debug("Discord Token is missing");
            return null;
        }

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

    @Bean
    public Executor asyncDiscordExecutor() {
//        TODO update to java 21
//        return new TaskExecutorAdapter(Executors.newVirtualThreadPerTaskExecutor());

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(1000);
        executor.setThreadNamePrefix("discord-bot-");
        executor.initialize();
        return executor;

    }


}
