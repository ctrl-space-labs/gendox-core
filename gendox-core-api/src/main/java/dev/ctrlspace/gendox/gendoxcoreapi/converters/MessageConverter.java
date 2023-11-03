package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageDTO;
import org.springframework.stereotype.Component;

@Component
public class MessageConverter implements GendoxConverter<Message, MessageDTO> {
    @Override
    public MessageDTO toDTO(Message message) {
        MessageDTO messageDto = new MessageDTO();

        messageDto.setId(message.getId());
        messageDto.setValue(message.getValue());
        messageDto.setThreadId(message.getThreadId());
        messageDto.setProjectId(message.getProjectId());

        return messageDto;
    }

    @Override
    public Message toEntity(MessageDTO messageDto) {
        Message message = new Message();

        message.setId(messageDto.getId());
        message.setValue(messageDto.getValue());
        message.setThreadId(messageDto.getThreadId());
        message.setProjectId(messageDto.getProjectId());

        return message;
    }
}
