package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.WalletKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WalletKeyCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.WalletKeyRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.WalletKeyPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.WalletKeyConstants;
import id.walt.crypto.keys.KeyType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import dev.ctrlspace.provenai.ssi.issuer.KeyCreation;
import dev.ctrlspace.provenai.ssi.issuer.KeyJwkExport;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
@Service
public class WalletKeyService {

    private WalletKeyRepository walletKeyRepository;
    private KeyCreation keyCreation;

    private KeyJwkExport keyJwkExport;



    @Autowired
    public WalletKeyService(WalletKeyRepository walletKeyRepository,
                            KeyCreation keyCreation,
                            KeyJwkExport keyJwkExport) {
        this.walletKeyRepository = walletKeyRepository;
        this.keyCreation = keyCreation;
        this.keyJwkExport = keyJwkExport;
    }



    private Map<String, KeyType> KeyTypeMap() {
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

        String keyTypeName = walletKey.getKeyTypeId().getName();
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

        KeyType keyType = KeyTypeMap().get(walletKey.getKeyTypeId().getName());

        walletKey.setLocalKey(keyCreation.generateKey(keyType,walletKey.getCharacterLength()));

        walletKey.setJwkKeyFormat(keyJwkExport.exportJWKObject(walletKey.getLocalKey()));

        walletKey = walletKeyRepository.save(walletKey);
        return walletKey;
    }

    public WalletKey updateWalletKey(WalletKey walletKey) throws GendoxException {

        walletKey = walletKeyRepository.save(walletKey);

        return walletKey;
    }

    public void deleteWalletKey(UUID id) throws GendoxException {
        WalletKey walletKey = this.getWalletKeybyId(id);
        walletKeyRepository.delete(walletKey);
    }


    public String exportWalletKeyJwk(UUID id) throws GendoxException {
        WalletKey walletKey = this.getWalletKeybyId(id);

        return walletKey.getJwkKeyFormat();
    }



}
