package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationDid;
import dev.ctrlspace.gendox.gendoxcoreapi.model.WalletKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationDidCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WalletKeyCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationDidRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.OrganizationDidPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.WalletKeyPredicates;
import dev.ctrlspace.provenai.ssi.issuer.DidIssuer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class OrganizationDidService {

    private OrganizationDidRepository organizationDidRepository;

    private DidIssuer didIssuer;

    private WalletKeyService walletKeyService;

    public OrganizationDidService(OrganizationDidRepository organizationDidRepository,
                                  DidIssuer didIssuer,
                                  WalletKeyService walletKeyService) {
        this.organizationDidRepository = organizationDidRepository;
        this.didIssuer = didIssuer;
        this.walletKeyService = walletKeyService;
    }


    public OrganizationDid getOrganizationDidById(UUID id) throws GendoxException {
        return organizationDidRepository.findById(id)
                .orElseThrow(() -> new GendoxException("ORGANIZATION_DID_NOT_FOUND", "Organization did not found with id: " + id, HttpStatus.NOT_FOUND));
    }


    public Page<OrganizationDid> getAllOrganizationDids(OrganizationDidCriteria criteria) throws GendoxException {
        return this.getAllOrganizationDids(criteria, PageRequest.of(0, 100));
    }

    public Page<OrganizationDid> getAllOrganizationDids(OrganizationDidCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return organizationDidRepository.findAll(OrganizationDidPredicates.build(criteria), pageable);
    }


    public OrganizationDid updateOrganizationDid(OrganizationDid organizationDid) throws GendoxException {

        organizationDid = organizationDidRepository.save(organizationDid);

        return organizationDid;
    }

    public void deleteOrganizationDid(UUID id) throws GendoxException {
        organizationDidRepository.deleteById(id);


    }

    public OrganizationDid createOrganizationDid(OrganizationDid organizationDid) throws GendoxException {

        if (organizationDid.getWebDomain() != null && organizationDid.getWebPath() != null) {
            organizationDid.setDid(String.valueOf(didIssuer.createDidFromWeb(organizationDid.getWebDomain(), organizationDid.getWebPath()
                    , walletKeyService.getKeyTypebyKeyId(organizationDid.getKeyId()))));
        } else if (organizationDid.getWebDomain() == null && organizationDid.getWebPath() == null) {

            organizationDid.setDid(String.valueOf(didIssuer.createDidFromKey(walletKeyService.getKeyTypebyKeyId(organizationDid.getKeyId()),
                    walletKeyService.getWalletKeybyId(organizationDid.getKeyId()).getLocalKey())));

        } else {
            // Error if only one of domain or path is null
            throw new GendoxException("INVALID_WEB_DID", "Both domain and path must be provided for web DIDs", HttpStatus.BAD_REQUEST);
        }
        organizationDid = organizationDidRepository.save(organizationDid);
        return organizationDid;
    }


    public String exportOrganizationDid(UUID id) throws GendoxException {
        OrganizationDid organizationDid = this.getOrganizationDidById(id);
        return organizationDid.getDid();

    }

}





