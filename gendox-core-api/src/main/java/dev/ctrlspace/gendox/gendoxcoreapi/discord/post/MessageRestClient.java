package dev.ctrlspace.gendox.gendoxcoreapi.discord.post;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.PostExchange;

import java.util.Map;
import java.util.UUID;

public interface MessageRestClient {


    @PostExchange("${gendox.domain.messages.search.post-search-message}")
    CompletionMessageDTO completionMessageDTO(@RequestHeader Map<String, String> headers, @RequestBody Message message, @RequestParam UUID projectId);

}
