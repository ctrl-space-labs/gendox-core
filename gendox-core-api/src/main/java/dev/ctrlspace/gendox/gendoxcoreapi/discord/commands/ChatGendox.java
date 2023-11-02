package dev.ctrlspace.gendox.gendoxcoreapi.discord.commands;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.CommonCommandUtility;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.constants.DiscordGendoxConstants;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.OptionType;
import net.dv8tion.jda.api.interactions.commands.build.OptionData;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


import java.util.ArrayList;
import java.util.List;

@Component
public class ChatGendox implements ICommand {

    Logger logger = org.slf4j.LoggerFactory.getLogger(ChatGendox.class);

    private CommonCommandUtility commonCommandUtility;


    @Autowired
    public ChatGendox(CommonCommandUtility commonCommandUtility) {
        this.commonCommandUtility = commonCommandUtility;
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

        logger.debug("Received command chat");

        commonCommandUtility.executeCommandCode(event, DiscordGendoxConstants.CHAT_GENDOX, null);


    }


}
