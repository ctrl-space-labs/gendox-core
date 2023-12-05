package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.AiMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.GptMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MessageAiMessageConverter implements GendoxConverter<Message, AiMessage> {

    @Autowired
    UserService userService;

    @Override
    public AiMessage toDTO(Message message) throws GendoxException {

        return AiMessage.builder()
                .role("user")
                .content(message.getValue())
                .build();


    }

    @Override
    public Message toEntity(AiMessage aiMessage) {
        Message message = new Message();
        message.setValue(aiMessage.getContent());
        return message;
    }

}
