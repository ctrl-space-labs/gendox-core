package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MessageAiMessageConverter implements GendoxConverter<Message, AiModelMessage> {

    @Autowired
    UserService userService;

    @Override
    public AiModelMessage toDTO(Message message) throws GendoxException {

        return AiModelMessage.builder()
                .role("user")
                .content(message.getValue())
                .build();


    }

    @Override
    public Message toEntity(AiModelMessage aiModelMessage) {
        Message message = new Message();
        message.setValue(aiModelMessage.getContent());
        return message;
    }

}
