package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.WalletKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WalletKeyDTO;
import org.springframework.stereotype.Component;

@Component
public class WalletKeyConverter implements GendoxConverter<WalletKey, WalletKeyDTO> {


    @Override
    public WalletKeyDTO toDTO(WalletKey walletKey) {
        WalletKeyDTO walletKeyDTO = new WalletKeyDTO();


        walletKeyDTO.setId(walletKey.getId());
        walletKeyDTO.setLocalKey(walletKey.getLocalKey());
        walletKeyDTO.setOrganizationId(walletKey.getOrganizationId());
        walletKeyDTO.setKeyTypeId(walletKey.getKeyTypeId());
        walletKeyDTO.setCharacterLength(walletKey.getCharacterLength());
        walletKeyDTO.setJwkKeyFormat(walletKey.getJwkKeyFormat());
        walletKeyDTO.setCreatedAt(walletKey.getCreatedAt());
        walletKeyDTO.setUpdatedAt(walletKey.getUpdatedAt());
        walletKeyDTO.setCreatedBy(walletKey.getCreatedBy());
        walletKeyDTO.setUpdatedBy(walletKey.getUpdatedBy());

        return walletKeyDTO;

    }

    @Override
    public WalletKey toEntity(WalletKeyDTO walletKeyDTO) {
        WalletKey walletKey = new WalletKey();

        walletKey.setId(walletKeyDTO.getId());
        walletKey.setLocalKey(walletKeyDTO.getLocalKey());
        walletKey.setOrganizationId(walletKeyDTO.getOrganizationId());
        walletKey.setKeyTypeId(walletKeyDTO.getKeyTypeId());
        walletKey.setCharacterLength(walletKeyDTO.getCharacterLength());
        walletKey.setJwkKeyFormat(walletKeyDTO.getJwkKeyFormat());
        walletKey.setCreatedAt(walletKeyDTO.getCreatedAt());
        walletKey.setUpdatedAt(walletKeyDTO.getUpdatedAt());
        walletKey.setCreatedBy(walletKeyDTO.getCreatedBy());
        walletKey.setUpdatedBy(walletKeyDTO.getUpdatedBy());

        return walletKey;
    }
}
