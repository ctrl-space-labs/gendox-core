package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.Gpt35Message;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.Gpt35Request;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.GPT35TurboConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MessageGpt35MessageConverter implements GendoxConverter<Message, Gpt35Message> {

    @Autowired
    UserService userService;
    @Override
    public Gpt35Message toDTO(Message message) throws GendoxException {

        return Gpt35Message.builder()
                .role("user")
                .content(message.getValue())
                .build();


    }

    @Override
    public Message toEntity(Gpt35Message gpt35Message) {
        Message message = new Message();
        message.setValue(gpt35Message.getContent());
        return message;
    }
}
