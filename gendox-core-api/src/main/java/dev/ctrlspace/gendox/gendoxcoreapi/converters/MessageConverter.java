package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageDto;
import org.springframework.stereotype.Component;

@Component
public class MessageConverter implements GendoxConverter<Message, MessageDto> {
    @Override
    public MessageDto toDTO(Message message) {
        MessageDto messageDto = new MessageDto();

        messageDto.setId(message.getId());
        messageDto.setValue(message.getValue());

        return messageDto;
    }

    @Override
    public Message toEntity(MessageDto messageDto) {
        Message message = new Message();

        message.setId(messageDto.getId());
        message.setValue(messageDto.getValue());

        return message;
    }
}
