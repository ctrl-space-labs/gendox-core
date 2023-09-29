package dev.ctrlspace.gendox.gendoxcoreapi.discord.commands;



import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.OptionMapping;
import net.dv8tion.jda.api.interactions.commands.OptionType;
import net.dv8tion.jda.api.interactions.commands.build.OptionData;


import java.util.ArrayList;
import java.util.List;


public class ChatWithBot implements ICommand {

    @Override
    public String getName() {
        return "chat";
    }

    @Override
    public String getDescription() {
        return "Chat with Bot";
    }

    @Override
    public List<OptionData> getOptions() {
        List<OptionData> data = new ArrayList<>();
        data.add(new OptionData(
                OptionType.STRING,
                "value",
                "users text",
                true));
        return data;
    }

    @Override
    public void execute(SlashCommandInteractionEvent event) {
        OptionMapping value = event.getOption("value");
        String answer = value.getAsString();


        answer = "Goodmorning : " +answer;
        event.reply(answer).queue();
    }
}

