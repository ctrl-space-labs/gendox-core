package dev.ctrlspace.gendox.gendoxcoreapi.services.agents.chat.templates;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;


public interface ChatTemplate {
    public String chatTemplate(Message message, String sectionValues);

}
