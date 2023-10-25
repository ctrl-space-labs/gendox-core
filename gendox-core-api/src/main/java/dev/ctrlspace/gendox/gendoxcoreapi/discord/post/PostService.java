package dev.ctrlspace.gendox.gendoxcoreapi.discord.post;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;


@Service
public class PostService {


    @Autowired
    private MessageRestClient messageRestClientService;


    public CompletionMessageDTO completionMessagePosts(String token, Message message, UUID projectId) {

        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("Authorization", "Bearer " + token);
        return messageRestClientService.completionMessageDTO(headers, message, projectId, 5);

    }

    public List<LinkedHashMap> searchMessagePosts(String token, Message message, UUID projectId) {

        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("Authorization", "Bearer " + token);
        return messageRestClientService.searchMessage(headers, message, projectId, 5);

    }


}
