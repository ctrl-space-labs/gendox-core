package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.WalletKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WalletKeyCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.WalletKeyRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.WalletKeyPredicates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import dev.ctrlspace.provenai.ssi.KeyCreation;
import java.util.UUID;

@Service
public class WalletKeyService {

    private WalletKeyRepository walletKeyRepository;


    @Autowired
    public WalletKeyService(WalletKeyRepository walletKeyRepository) {
        this.walletKeyRepository = walletKeyRepository;
    }

    public WalletKey getWalletKeybyId(UUID id) throws GendoxException {
        return walletKeyRepository.findById(id)
                .orElseThrow(() -> new GendoxException("WALLET_KEY_NOT_FOUND", "Wallet key not found with id: " + id, HttpStatus.NOT_FOUND));
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
//add a field for character length/
//        walletKey.setKeyTypeId();
        walletKey.setPrivateKey();


        walletKey = walletKeyRepository.save(walletKey);
        return walletKey;
    }








}
