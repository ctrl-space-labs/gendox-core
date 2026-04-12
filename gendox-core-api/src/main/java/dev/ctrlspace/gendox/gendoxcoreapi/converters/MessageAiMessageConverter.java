package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MessageAiMessageConverter implements GendoxConverter<Message, AiModelMessage> {

    @Autowired
    UserService userService;

    @Override
    public AiModelMessage toDTO(Message message) throws GendoxException {
        String role = "user";
        if (message.getRole() != null) {
            role = message.getRole();
        }

        List<ContentPart> nonTextParts = message.getAdditionalResources().stream()
                .filter(part -> !"text".equals(part.getType()))
                .toList();

        AiModelMessage.AiModelMessageBuilder builder = AiModelMessage.builder()
                .role(role)
                .content(message.getValue())
                .name(message.getName())
                .toolCallId(message.getToolCallId())
                .toolCalls(message.getToolCalls());

        if (!nonTextParts.isEmpty()) {
            builder.contentParts(nonTextParts);
        }

        return builder.build();
    }

    @Override
    public Message toEntity(AiModelMessage aiModelMessage) {
        Message message = new Message();
        message.setValue(aiModelMessage.getContent());
        message.setRole(aiModelMessage.getRole());
        message.setName(aiModelMessage.getName());
        message.setToolCallId(aiModelMessage.getToolCallId());
        message.setToolCalls(aiModelMessage.getToolCalls());


        return message;
    }

}
