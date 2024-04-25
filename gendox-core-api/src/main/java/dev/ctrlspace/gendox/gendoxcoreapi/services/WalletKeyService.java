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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import dev.ctrlspace.provenai.ssi.issuer.KeyCreation;
import dev.ctrlspace.provenai.ssi.issuer.LocalKeyWrapper;

import java.time.Instant;
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

    public String getPrivateJWKbyKeyId(UUID keyId) throws GendoxException {
        WalletKey walletKey = walletKeyRepository.findById(keyId)
                .orElseThrow(() -> new GendoxException("WALLET_KEY_NOT_FOUND",
                        "Wallet key not found with id: " + keyId, HttpStatus.NOT_FOUND));

        String privateJWK = walletKey.getJwkPrivateKey();

        return privateJWK;
    }
    public KeyType getKeyTypeFromMap(String keyTypeName) throws GendoxException {
        KeyType keyType = KeyTypeMap().get(keyTypeName);
        if (keyType == null) {
            throw new GendoxException("KEY_TYPE_NOT_FOUND", "Key type not found with name: " + keyTypeName, HttpStatus.NOT_FOUND);
        }
        return keyType;
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

    public WalletKey createWalletKey(WalletKey walletKey,  LocalKey localKey) throws GendoxException {

//        set default value if not defined
        if (walletKey.getCreatedAt() == null) {
            walletKey.setCreatedAt(Instant.now());
        }
        if (walletKey.getUpdatedAt() == null) {
            walletKey.setUpdatedAt(Instant.now());
        }
        LocalKeyWrapper localKeyWrapper = new LocalKeyWrapper();
        String jwk = localKeyWrapper.getJwk(localKey);
        KeyType keyType = localKeyWrapper.getKeyType(localKey);
        // Assuming walletKey has the necessary properties set, such as organizationId, etc.

        // Set the public key from the local key
        LocalKey publicKey = localKeyWrapper.getPublicKey(localKey);
        walletKey.setPublicKey(publicKey.getJwk());

        // Set the private key from the local key
        walletKey.setJwkPrivateKey(jwk);

        // Set the key type
        String keyTypeName = getKeyTypeName(keyType);
        Type walletKeyType = typeService.getKeyTypeByName(keyTypeName);
        walletKey.setKeyType(walletKeyType);

        // Save the WalletKey entity
        walletKey = walletKeyRepository.save(walletKey);

        return walletKey;
    }



    public void deleteWalletKey(UUID id) throws GendoxException {
        WalletKey walletKey = this.getWalletKeybyId(id);
        walletKeyRepository.delete(walletKey);
    }



    public WalletKey importWalletKey(LocalKey localKey, UUID organizationId) throws GendoxException {
        // Extract the necessary information from the LocalKey object
        LocalKeyWrapper localKeyWrapper = new LocalKeyWrapper();
        String jwk = localKeyWrapper.getJwk(localKey);
        KeyType keyType = localKeyWrapper.getKeyType(localKey);
        WalletKey walletKey = new WalletKey();
        walletKey.setJwkPrivateKey(jwk); // Set the entire JWK
//        get the public key object and its Jwk
        LocalKey publicKey = localKeyWrapper.getPublicKey(localKey);
        walletKey.setPublicKey(publicKey.getJwk()); // Set only the public part
        String keyTypeName = getKeyTypeName(keyType);
        Type walletKeyType = typeService.getKeyTypeByName(keyTypeName);

        walletKey.setKeyType(walletKeyType);


        walletKey.setOrganizationId(organizationId);
        // Set other properties as needed...
        // Save the WalletKey entity
        walletKey = walletKeyRepository.save(walletKey);

        return walletKey;
    }

//i want to get the KeyTypeName from the Map given the keyType
    public String getKeyTypeName(KeyType keyType) throws GendoxException {
        for (Map.Entry<String, KeyType> entry : KeyTypeMap().entrySet()) {
            if (entry.getValue().equals(keyType)) {
                return entry.getKey();
            }
        }
        throw new GendoxException("KEY_TYPE_NOT_FOUND", "Key type not found with value: " + keyType, HttpStatus.NOT_FOUND);
    }
    public String exportWalletKeyJwk(UUID id) throws GendoxException {
        WalletKey walletKey = this.getWalletKeybyId(id);

        return walletKey.getJwkPrivateKey();
    }



    public LocalKey generateLocalKey(String keyTypeName, Integer characterLength) throws GendoxException {
        KeyType keyType = getKeyTypeFromMap(keyTypeName);
        if (characterLength == null) {
            characterLength = WalletKeyConstants.DEFAULT_KEY_LENGTH;
        }
        return keyCreation.generateKey(keyType, characterLength);
    }


}
