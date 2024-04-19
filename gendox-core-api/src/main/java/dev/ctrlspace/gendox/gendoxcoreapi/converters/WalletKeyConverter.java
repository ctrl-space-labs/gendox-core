package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import com.fasterxml.jackson.core.JsonProcessingException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.WalletKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WalletKeyDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class WalletKeyConverter implements GendoxConverter<WalletKey, WalletKeyDTO> {

    @Autowired
    private TypeService typeService;

    @Override
    public WalletKeyDTO toDTO(WalletKey walletKey) throws JsonProcessingException {
        WalletKeyDTO walletKeyDTO = new WalletKeyDTO();


        walletKeyDTO.setId(walletKey.getId());
        walletKeyDTO.setPublicKey(walletKey.getPublicKey());
        walletKeyDTO.setOrganizationId(walletKey.getOrganizationId());
        walletKeyDTO.setKeyType(walletKey.getKeyType());
        walletKeyDTO.setCharacterLength(walletKey.getCharacterLength());
        walletKeyDTO.setCreatedAt(walletKey.getCreatedAt());
        walletKeyDTO.setUpdatedAt(walletKey.getUpdatedAt());
        walletKeyDTO.setCreatedBy(walletKey.getCreatedBy());
        walletKeyDTO.setUpdatedBy(walletKey.getUpdatedBy());

        return walletKeyDTO;

    }

    @Override
    public WalletKey toEntity(WalletKeyDTO walletKeyDTO) throws GendoxException {
        WalletKey walletKey = new WalletKey();

        walletKey.setId(walletKeyDTO.getId());
        walletKey.setPublicKey(walletKeyDTO.getPublicKey());
        walletKey.setOrganizationId(walletKeyDTO.getOrganizationId());
        walletKey.setKeyType(typeService.getKeyTypeByName(walletKeyDTO.getKeyType().getName()));
        walletKey.setCharacterLength(walletKeyDTO.getCharacterLength());
        walletKey.setCreatedAt(walletKeyDTO.getCreatedAt());
        walletKey.setUpdatedAt(walletKeyDTO.getUpdatedAt());
        walletKey.setCreatedBy(walletKeyDTO.getCreatedBy());
        walletKey.setUpdatedBy(walletKeyDTO.getUpdatedBy());

        return walletKey;
    }
}
