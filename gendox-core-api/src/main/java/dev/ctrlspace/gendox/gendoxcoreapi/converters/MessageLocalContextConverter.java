package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageLocalContext;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageLocalContextDTO;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class MessageLocalContextConverter implements GendoxConverter<MessageLocalContext, MessageLocalContextDTO> {
    @Override
    public MessageLocalContextDTO toDTO(MessageLocalContext messageLocalContext) {
        MessageLocalContextDTO dto = new MessageLocalContextDTO();

        return dto;
    }

    @Override
    public MessageLocalContext toEntity(MessageLocalContextDTO messageLocalContextDto) {
        if(messageLocalContextDto == null) return null;
        MessageLocalContext entity = new MessageLocalContext();


        if (messageLocalContextDto.getContextType() != null) {
            entity.setContextTypeName(messageLocalContextDto.getContextType());
        }

        if(messageLocalContextDto.getValue() != null) {
            entity.setValue(messageLocalContextDto.getValue());
        }

        return entity;
    }

    public List<MessageLocalContext> toEntities(Message message, List<MessageLocalContextDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return Collections.emptyList();

        return dtos.stream()
                .filter(Objects::nonNull)
                .map(this::toEntity)
                .filter(Objects::nonNull)
                .peek(e -> e.setMessage(message))
                .collect(Collectors.toList());
    }


}
