package dev.ctrlspace.gendox.provenAi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SearchResult;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationDidService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectAgentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.WalletKeyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class ProvenAiService {

    private ProjectAgentService projectAgentService;
    private ProjectService projectService;
    private WalletKeyService walletKeyService;
    private OrganizationDidService organizationDidService;

    private ProvenAiAgentAuthenticationAdapter provenAiAgentAuthenticationAdapter;

    private ProvenAiQueryAdapter provenAiQueryAdapter;


    @Autowired
    public ProvenAiService(
            ProjectAgentService projectAgentService,
            ProjectService projectService,
            WalletKeyService walletKeyService,
            OrganizationDidService organizationDidService,
            ProvenAiAgentAuthenticationAdapter provenAiAgentAuthenticationAdapter,
            ProvenAiQueryAdapter provenAiQueryAdapter
    ) {
        this.projectAgentService = projectAgentService;
        this.projectService = projectService;
        this.walletKeyService = walletKeyService;
        this.organizationDidService = organizationDidService;
        this.provenAiAgentAuthenticationAdapter = provenAiAgentAuthenticationAdapter;
        this.provenAiQueryAdapter = provenAiQueryAdapter;
    }


    public String getAgentToken(UUID projectId) throws GendoxException, IOException {

        ProjectAgent projectAgent = projectAgentService.getAgentByProjectId(projectId);
        Project project = projectService.getProjectById(projectId);

        Object agentVpJwt = projectAgentService.createVerifiablePresentation(projectAgent,
                walletKeyService.getWalletKeybyOrganizationId(project.getOrganizationId()).getJwkPrivateKey(),
                organizationDidService.getOrganizationDidByOrganizationId(project.getOrganizationId()).getDid());

        return provenAiAgentAuthenticationAdapter.getAgentToken((String) agentVpJwt).getToken();

    }

    public List<SearchResult> search(String question, UUID projectId) throws GendoxException, IOException {

        return provenAiQueryAdapter.provenAiSearch(question, getAgentToken(projectId));
    }


}
