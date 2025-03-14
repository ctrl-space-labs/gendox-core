package dev.ctrlspace.gendox.provenAi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SearchResult;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationDidService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectAgentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.WalletKeyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
public class ProvenAiService {

    private ProjectAgentService projectAgentService;
    private ProjectService projectService;
    private WalletKeyService walletKeyService;
    private OrganizationDidService organizationDidService;

    private ProvenAiAgentAuthenticationAdapter provenAiAgentAuthenticationAdapter;

    private ProvenAiQueryAdapter provenAiQueryAdapter;

    private static final Logger logger = LoggerFactory.getLogger(ProvenAiService.class);



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


    @Cacheable(value = "ProvenAiService#getAgentToken", keyGenerator = "gendoxKeyGenerator")
    public String getAgentToken(ProjectAgent projectAgent) throws GendoxException, IOException {


        String organizationDid = projectAgent.getOrganizationDid();

        logger.debug("Organization DID: " + organizationDid);

        Object agentVpJwt = projectAgentService.createVerifiablePresentation(projectAgent,
                walletKeyService.getWalletKeybyOrganizationId(projectAgent.getProject().getOrganizationId()).getJwkKeyFormat(),organizationDid);

        logger.debug("Agent VP JWT created");

        return provenAiAgentAuthenticationAdapter.provenAiAgentAuthentication((String) agentVpJwt).getToken();

    }

    public List<SearchResult> search(String question, ProjectAgent projectAgent) throws GendoxException, IOException {

        String agentJwt = this.getAgentToken(projectAgent);
        return provenAiQueryAdapter.provenAiSearch(question, agentJwt);
    }


}
