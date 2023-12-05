//package dev.ctrlspace.gendox.gendoxcoreapi.converters;
//import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.Gpt35Message;
//import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.GptMessage;
//import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
//import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
//import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Component;
//
//@Component

//public class MessageGptMessageConverter implements GendoxConverter<Message, GptMessage>{
//
//    @Autowired
//    UserService userService;
//
//    @Override
//    public GptMessage toDTO(Message message) throws GendoxException {
//
//        return GptMessage.builder()
//                .role("user")
//                .content(message.getValue())
//                .build();
//
//
//    }
//
//    @Override
//    public Message toEntity(GptMessage gptMessage) {
//        Message message = new Message();
//        message.setValue(gptMessage.getContent());
//        return message;
//    }
//}
