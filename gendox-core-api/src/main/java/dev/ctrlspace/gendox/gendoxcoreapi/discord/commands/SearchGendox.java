package dev.ctrlspace.gendox.gendoxcoreapi.discord.commands;


import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.CommonCommandUtility;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.constants.DiscordGendoxConstants;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.OptionType;
import net.dv8tion.jda.api.interactions.commands.build.OptionData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;


@Component
public class SearchGendox implements ICommand {

    Logger logger = LoggerFactory.getLogger(SearchGendox.class);
    private CommonCommandUtility commonCommandUtility;

    @Autowired
    public SearchGendox(CommonCommandUtility commonCommandUtility) {
        this.commonCommandUtility = commonCommandUtility;
    }

    @Override
    public String getName() {
        return "search";
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
                "Search Gendox",
                true));
        return data;
    }

    @Override
    public void execute(SlashCommandInteractionEvent event) {
        commonCommandUtility.executeCommandCode(event, DiscordGendoxConstants.SEARCH_GENDOX, null);

    }

}
















