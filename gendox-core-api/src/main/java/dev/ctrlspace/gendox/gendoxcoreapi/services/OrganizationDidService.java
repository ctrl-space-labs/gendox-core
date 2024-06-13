package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationDid;
import dev.ctrlspace.gendox.gendoxcoreapi.model.WalletKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationDidCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WalletKeyCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.request.VerifiableCredentialRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationDidRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.OrganizationDidPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.WalletKeyPredicates;
import dev.ctrlspace.provenai.ssi.issuer.DidIssuer;
import dev.ctrlspace.provenai.ssi.issuer.KeyCreation;
import dev.ctrlspace.provenai.ssi.issuer.LocalKeyWrapper;
import dev.ctrlspace.provenai.ssi.issuer.VerifiableCredentialBuilder;
import id.walt.credentials.vc.vcs.W3CVC;
import id.walt.crypto.keys.KeyType;
import id.walt.crypto.keys.LocalKey;
import id.walt.did.dids.registrar.DidResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class OrganizationDidService {

    private OrganizationDidRepository organizationDidRepository;

    private DidIssuer didIssuer;
    private KeyCreation keyCreation;

    private WalletKeyService walletKeyService;

    private VerifiableCredentialBuilder verifiableCredentialBuilder;

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

//    get OrganizationDid by organization Id
    public OrganizationDid getOrganizationDidByOrganizationId(UUID organizationId) throws GendoxException {
        return organizationDidRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new GendoxException("ORGANIZATION_DID_NOT_FOUND", "Organization did not found with organization id: " + organizationId, HttpStatus.NOT_FOUND));
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

        DidResult didResult = didIssuer.resolveWebDidToKey(walletKeyService.getKeyTypebyKeyId(organizationDid.getKeyId()),
                organizationDid.getWebDomain(),
                organizationDid.getWebPath(),
                localKey
        );

        // Create the web DID
        organizationDid.setDid(String.valueOf(didResult.getDidDocument()));
        return organizationDidRepository.save(organizationDid);
    }



    public OrganizationDid createOrganizationKeyDid(OrganizationDid organizationDid) throws GendoxException {

        // Create a new DID issuer
        DidIssuer didIssuer = new DidIssuer();
        String jwk = walletKeyService.getPrivateJWKbyKeyId(organizationDid.getKeyId());
        LocalKey localKey = new LocalKey(jwk);

        // Create a LocalKey object using the LocalKeyWrapper

        DidResult didResult = didIssuer.resolveKeyDidToKey(walletKeyService.getKeyTypebyKeyId(organizationDid.getKeyId()),
                false, localKey);

        organizationDid.setDid(String.valueOf(didResult.getDid()));


        return organizationDidRepository.save(organizationDid);
    }



    public String exportOrganizationDid(UUID id) throws GendoxException {
        OrganizationDid organizationDid = this.getOrganizationDidById(id);
        return organizationDid.getDid();

    }

//method to get keyId from didId
    public UUID getKeyIdByDidId(UUID didId) throws GendoxException {
        OrganizationDid organizationDid = getOrganizationDidById(didId);
        return organizationDid.getKeyId();
    }

//    public Object createAndSignVerifiableCredential(UUID issuerDidId, UUID subjectDidId,
//                                                    VerifiableCredentialRequest vcRequest) throws GendoxException {
//        // Retrieve keys and DIDs from their IDs
//
//        OrganizationDid issuerDid = getOrganizationDidById(issuerDidId);
//        OrganizationDid subjectDid = getOrganizationDidById(subjectDidId);
//
//        LocalKey issuerKey = new LocalKey(walletKeyService.getWalletKeybyId(getKeyIdByDidId(issuerDidId)).getJwkPrivateKey());
//
//
//        // Set issuer DID and subject DID
//        verifiableCredentialBuilder.setIssuerDid(issuerDid.getDid());
//        verifiableCredentialBuilder.setSubjectDid(subjectDid.getDid());
//
//        verifiableCredentialBuilder.addType(vcRequest.getType());
//        verifiableCredentialBuilder.addContext(vcRequest.getContext());
//
//
//        // Set validity period
//        if (vcRequest.getValidityPeriod() != null) {
//            verifiableCredentialBuilder.validFor(vcRequest.getValidityPeriod());
//        } else {
//            // Default validity from now
//            verifiableCredentialBuilder.validFromNow();
//            verifiableCredentialBuilder.validUntil(vcRequest.getValidUntil());
//        }
//
//        verifiableCredentialBuilder.credentialSubject(vcRequest.getCredentialSubject());
//
//        W3CVC verifiableCredential = verifiableCredentialBuilder.buildCredential();
//
//
//        return verifiableCredentialBuilder.signCredential(verifiableCredential, issuerKey, issuerDid.getDid(),
//                                            subjectDid.getDid(), vcRequest.getAdditionalJwtHeaders(),
//                                            vcRequest.getAdditionalJwtOptions());
//
//    }


    }






