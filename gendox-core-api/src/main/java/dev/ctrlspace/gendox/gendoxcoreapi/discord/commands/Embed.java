package dev.ctrlspace.gendox.gendoxcoreapi.discord.commands;

import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.build.OptionData;

import java.awt.*;
import java.util.List;

public class Embed implements ICommand {
    @Override
    public String getName() {
        return "embed";
    }

    @Override
    public String getDescription() {
        return "Will send an embed";
    }

    @Override
    public List<OptionData> getOptions() {
        return null;
    }

    @Override
    public void execute(SlashCommandInteractionEvent event) {
        EmbedBuilder builder = new EmbedBuilder();
        builder.setTitle("Example Embed");
        builder.setDescription("An example embed");
        builder.addField("Filed1", "Value",true);
        builder.addField("Filed2", "Value",true);
        builder.addField("Filed3", "Value",true);
        builder.setFooter("Example Footer");
        builder.setColor(Color.blue);
        builder.appendDescription(" This has been added");
        event.replyEmbeds(builder.build()).queue();
    }
}
