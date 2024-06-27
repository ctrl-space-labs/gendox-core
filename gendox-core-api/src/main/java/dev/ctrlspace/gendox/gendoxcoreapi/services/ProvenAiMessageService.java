package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationDid;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProvenAiMessageHook;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.EventPayloadDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationDidDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebHookEventResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ProvenAiMessageService {

    private ProjectAgentService projectAgentService;

    private OrganizationDidService organizationDidService;

    @Autowired
    ProvenAiMessageService(ProjectAgentService projectAgentService,
                           OrganizationDidService organizationDidService){
        this.projectAgentService = projectAgentService;
        this.organizationDidService = organizationDidService;

    }

    public ResponseEntity<WebHookEventResponse> handleMessage(ProvenAiMessageHook message) throws GendoxException {
        String messageType = message.getMessageType();
        EventPayloadDTO payload = message.getMessagePayload();

        if ("PROVEN_AI_AGENT_REGISTRATION".equals(messageType)) {
            ProjectAgent projectAgent = projectAgentService.getAgentById(UUID.fromString(payload.getProjectAgentId()));
            projectAgent.setOrganizationDid(payload.getOrganizationDid());
            projectAgentService.updateProjectAgent(projectAgent);
            return ResponseEntity.ok(new WebHookEventResponse("Agent registered successfully"));
        }
        else if ("PROVEN_AI_ORGANIZATION_REGISTRATION".equals(messageType)) {
            OrganizationDidDTO organizationDidDTO = OrganizationDidDTO.builder()
                    .organizationId(UUID.fromString(payload.getOrganizationId()))
                    .did(payload.getOrganizationDid())
                    .build();
            organizationDidService.importOrganizationDid(organizationDidDTO, UUID.fromString(payload.getOrganizationId()));
            return ResponseEntity.ok(new WebHookEventResponse("Organization registered successfully"));
        }
        else if("PROVEN_AI_REQUEST_ORGANIZATION_DID".equals(messageType)) {
            String organizationDid =  organizationDidService.getOrganizationDidByOrganizationId(UUID.fromString(payload.getOrganizationId())).getDid();

            return ResponseEntity.ok(new WebHookEventResponse(organizationDid));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new WebHookEventResponse("Invalid message type: " + messageType));
    }
}
