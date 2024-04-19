package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.WalletKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WalletKeyCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.WalletKeyRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.WalletKeyPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.WalletKeyConstants;
import id.walt.crypto.keys.KeyType;
import id.walt.crypto.keys.LocalKey;
import kotlin.coroutines.Continuation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import dev.ctrlspace.provenai.ssi.issuer.KeyCreation;
import dev.ctrlspace.provenai.ssi.issuer.LocalKeyWrapper;
import dev.ctrlspace.provenai.utils.ContinuationObjectUtils;

import java.util.*;

@Service
public class WalletKeyService {

    private WalletKeyRepository walletKeyRepository;
    private KeyCreation keyCreation;

    private LocalKeyWrapper localKeyWrapper;

    private TypeService typeService;



    @Autowired
    public WalletKeyService(WalletKeyRepository walletKeyRepository,
                            TypeService typeService
                      ) {
        this.walletKeyRepository = walletKeyRepository;
        this.typeService = typeService;


    }



    public Map<String, KeyType> KeyTypeMap() {
        Map<String, KeyType> map = new HashMap<>();
        // Populate the map with the mappings between key type names and KeyType enum values
        map.put(WalletKeyConstants.RSA, KeyType.RSA);
        map.put(WalletKeyConstants.SECP256K1, KeyType.secp256k1);
        map.put(WalletKeyConstants.SECP256R1, KeyType.secp256r1);
        map.put(WalletKeyConstants.ED25519, KeyType.Ed25519);
        return map;
    }

    public WalletKey getWalletKeybyId(UUID id) throws GendoxException {
        return walletKeyRepository.findById(id)
                .orElseThrow(() -> new GendoxException("WALLET_KEY_NOT_FOUND", "Wallet key not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    public KeyType getKeyTypebyKeyId(UUID keyId) throws GendoxException {
        WalletKey walletKey = walletKeyRepository.findById(keyId)
                .orElseThrow(() -> new GendoxException("WALLET_KEY_NOT_FOUND",
                        "Wallet key not found with id: " + keyId, HttpStatus.NOT_FOUND));

        String keyTypeName = walletKey.getKeyType().getName();
        return KeyTypeMap().get(keyTypeName);
    }



    public Page<WalletKey> getAllWalletKeys(WalletKeyCriteria criteria) throws GendoxException {
        return this.getAllWalletKeys(criteria, PageRequest.of(0, 100));
    }

    public Page<WalletKey> getAllWalletKeys(WalletKeyCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return walletKeyRepository.findAll(WalletKeyPredicates.build(criteria), pageable);
    }

    public WalletKey createWalletKey(WalletKey walletKey) throws GendoxException {

//        set default value if not defined

        if (walletKey.getCharacterLength() == null) {
            walletKey.setCharacterLength(WalletKeyConstants.DEFAULT_KEY_LENGTH);
        }
        LocalKeyWrapper localKeyWrapper = new LocalKeyWrapper();

        KeyType keyType = KeyTypeMap().get(walletKey.getKeyType().getName());

        LocalKey localKey = keyCreation.generateKey(keyType,walletKey.getCharacterLength());

        LocalKey publicKey = localKeyWrapper.getPublicKey(localKey);

        walletKey.setPublicKey(publicKey.getJwk());


        walletKey.setJwkPrivateKey((String) localKeyWrapper.exportJWK(localKey));

        walletKey = walletKeyRepository.save(walletKey);
        return walletKey;
    }



    public void deleteWalletKey(UUID id) throws GendoxException {
        WalletKey walletKey = this.getWalletKeybyId(id);
        walletKeyRepository.delete(walletKey);
    }

    public WalletKey importWalletKeyJwk(UUID organizationId, String jwk) throws JsonProcessingException, GendoxException {
        // Validate the format of the publicKey
        ObjectMapper mapper = new ObjectMapper();
        JsonNode jwkNode = mapper.readTree(jwk);

          String keyTypeName = jwkNode.path("keyType").path("name").asText();
        Type keyType = typeService.getKeyTypeByName(keyTypeName);
        // Create a new WalletKey entity and set its publicKey
        WalletKey walletKey = new WalletKey();
        walletKey.setPublicKey(jwk);
        walletKey.setOrganizationId(organizationId);
        walletKey.setKeyType(keyType); //

        walletKey = walletKeyRepository.save(walletKey);

        return walletKey;
    }


    public String exportWalletKeyJwk(UUID id) throws GendoxException {
        WalletKey walletKey = this.getWalletKeybyId(id);

        return walletKey.getJwkPrivateKey();
    }



}
