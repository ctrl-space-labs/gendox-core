package dev.ctrlspace.gendox.gendoxcoreapi.discord.commands;



import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.CommonCommandUtility;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.utils.constants.DiscordGendoxConstants;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.OptionMapping;
import net.dv8tion.jda.api.interactions.commands.OptionType;
import net.dv8tion.jda.api.interactions.commands.build.OptionData;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


import java.util.ArrayList;
import java.util.List;

@Component
public class ReplyGendox implements ICommand {

    Logger logger = org.slf4j.LoggerFactory.getLogger(ReplyGendox.class);

    private CommonCommandUtility commonCommandUtility;

    @Autowired
    public ReplyGendox(CommonCommandUtility commonCommandUtility) {
        this.commonCommandUtility = commonCommandUtility;
    }



    @Override
    public String getName() {
        return "reply";
    }

    @Override
    public String getDescription() {
        return "Reply with Bot";
    }

    @Override
    public List<OptionData> getOptions() {
        List<OptionData> data = new ArrayList<>();
        // Add the "thread" option
        data.add(new OptionData(
                OptionType.STRING,
                "thread",
                "Thread id",
                true));
        // Add the "reply" option
        data.add(new OptionData(
                OptionType.STRING,
                "question",
                "Reply Gendox Ai Agent's answer",
                true));
        return data;
    }

    @Override
    public void execute(SlashCommandInteractionEvent event) {

        OptionMapping threadOption = event.getOption("thread");

        if (threadOption == null) {
            event.reply("Please provide 'thread' option.").queue();
            return;
        }

        String threadId = threadOption.getAsString();

       commonCommandUtility.executeCommandCode(event, DiscordGendoxConstants.REPLY_GENDOX, threadId);


    }
}

