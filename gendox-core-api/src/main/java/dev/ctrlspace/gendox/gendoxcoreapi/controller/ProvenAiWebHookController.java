package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProvenAiMessageHook;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.EventPayloadDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebHookEventResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProvenAiMessageService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class ProvenAiWebHookController {

    private ProvenAiMessageService provenAiMessageService;

    @Autowired
    public ProvenAiWebHookController(ProvenAiMessageService provenAiMessageService) {
        this.provenAiMessageService = provenAiMessageService;
    }

    @PostMapping("/proven-ai/web-hook")
    @Operation(summary = "Web hook to handle provenAI messages.",
            description = """
                    
                    """)
    public ResponseEntity<WebHookEventResponse> webHookEvent(@RequestParam String messageType, @RequestBody EventPayloadDTO eventPayload) throws GendoxException {
        ProvenAiMessageHook message = new ProvenAiMessageHook(messageType, eventPayload);

        return provenAiMessageService.handleMessage(message);
    }

}
