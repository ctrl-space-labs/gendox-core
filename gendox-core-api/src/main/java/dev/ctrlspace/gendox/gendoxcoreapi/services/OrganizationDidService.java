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
import dev.ctrlspace.provenai.ssi.issuer.KeyCreation;
import dev.ctrlspace.provenai.ssi.issuer.LocalKeyWrapper;
import id.walt.crypto.keys.KeyType;
import id.walt.crypto.keys.LocalKey;
import org.springframework.beans.factory.annotation.Autowired;
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
    private KeyCreation keyCreation;

    private WalletKeyService walletKeyService;

    @Autowired
    public OrganizationDidService(OrganizationDidRepository organizationDidRepository,
                                  WalletKeyService walletKeyService) {
        this.organizationDidRepository = organizationDidRepository;
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


    public void deleteOrganizationDid(UUID id) throws GendoxException {
        organizationDidRepository.deleteById(id);


    }

    public OrganizationDid createOrganizationWebDid(OrganizationDid organizationDid) throws GendoxException {


        // Check if both web domain and path are provided
        if (organizationDid.getWebDomain() == null || organizationDid.getWebPath() == null) {
            throw new GendoxException("INVALID_WEB_DID", "Both domain and path must be provided for web DIDs", HttpStatus.BAD_REQUEST);
        }
        String jwk = walletKeyService.getPrivateJWKbyKeyId(organizationDid.getKeyId());
        LocalKey localKey = new LocalKey(jwk);

        DidIssuer didIssuer = new DidIssuer();

        // Create the web DID
        organizationDid.setDid(String.valueOf(didIssuer.resolveWebDidToKey(walletKeyService.getKeyTypebyKeyId(organizationDid.getKeyId()),
                organizationDid.getWebDomain(),
                organizationDid.getWebPath(),
                localKey
        )));
        return organizationDidRepository.save(organizationDid);
    }



    public OrganizationDid createOrganizationKeyDid(OrganizationDid organizationDid) throws GendoxException {

        // Create a new DID issuer
        DidIssuer didIssuer = new DidIssuer();
        String jwk = walletKeyService.getPrivateJWKbyKeyId(organizationDid.getKeyId());
        LocalKey localKey = new LocalKey(jwk);

        // Create a LocalKey object using the LocalKeyWrapper
        LocalKeyWrapper localKeyWrapper = new LocalKeyWrapper();

        organizationDid.setDid(String.valueOf(didIssuer.resolveKeyDidToKey(walletKeyService.getKeyTypebyKeyId(organizationDid.getKeyId()),
                false, (LocalKey) localKeyWrapper.exportJWK(localKey))));

        return organizationDidRepository.save(organizationDid);
    }


    public OrganizationDid createOrganizationDid(OrganizationDid organizationDid) throws GendoxException {
        // Get the key ID from the organizationDid

        String jwk = walletKeyService.getPrivateJWKbyKeyId(organizationDid.getKeyId());
        LocalKey localKey = new LocalKey(jwk);
        // Get the key type for the specified key ID
        KeyType keyType = walletKeyService.getKeyTypebyKeyId(organizationDid.getKeyId());

        // Create a new DID issuer
        DidIssuer didIssuer = new DidIssuer();

        // Check if both web domain and path are provided
        if (organizationDid.getWebDomain() != null && organizationDid.getWebPath() != null) {
           return createOrganizationWebDid(organizationDid);
        } else {
            // Create a key DID
           return createOrganizationKeyDid(organizationDid);
        }

    }


    public String exportOrganizationDid(UUID id) throws GendoxException {
        OrganizationDid organizationDid = this.getOrganizationDidById(id);
        return organizationDid.getDid();

    }

    }






