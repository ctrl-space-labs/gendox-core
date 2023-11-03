package dev.ctrlspace.gendox.gendoxcoreapi.discord.commands;

import dev.ctrlspace.gendox.gendoxcoreapi.discord.ListenerService;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.build.OptionData;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;

import java.util.List;


public interface ICommand {

    String getName();
    String getDescription();
    List<OptionData> getOptions();
    void execute(SlashCommandInteractionEvent event);
}
